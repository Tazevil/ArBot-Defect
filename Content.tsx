/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ResizePayload, useResizeDetector} from 'react-resize-detector';
import {
  ActiveColorAtom,
  BoundingBoxes2DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  DrawModeAtom,
  ImageSentAtom,
  ImageSrcAtom,
  LinesAtom,
  LineThicknessAtom,
  PointsAtom,
  RevealOnHoverModeAtom,
  ShareStream,
  ShowBoxesAtom,
  ShowLabelsAtom,
  VideoRefAtom,
} from './atoms';
import {segmentationColorsRgb} from './consts';
import {getSvgPathFromStroke, stringToHslColor} from './utils';

type EditingState = {
  type: '2d' | 'mask' | 'point';
  index: number;
};

export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [boundingBoxes2D, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [boundingBoxMasks, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [points, setPoints] = useAtom(PointsAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [hoverEntered, setHoverEntered] = useState(false);
  const [hoveredBox, _setHoveredBox] = useState<number | null>(null);
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);
  const [lineThickness] = useAtom(LineThicknessAtom);

  const [showLabels] = useAtom(ShowLabelsAtom);
  const [showBoxes] = useAtom(ShowBoxesAtom);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [editingText, setEditingText] = useState('');

  // Handling resize and aspect ratios
  const boundingBoxContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerDims, setContainerDims] = useState({
    width: 0,
    height: 0,
  });
  const [activeMediaDimensions, setActiveMediaDimensions] = useState({
    width: 1,
    height: 1,
  });

  const onResize = useCallback((el: ResizePayload) => {
    if (el.width && el.height) {
      setContainerDims({
        width: el.width,
        height: el.height,
      });
    }
  }, []);

  const {ref: containerRef} = useResizeDetector({onResize});

  const boundingBoxContainer = useMemo(() => {
    const {width, height} = activeMediaDimensions;
    const aspectRatio = width / height;
    const containerAspectRatio = containerDims.width / containerDims.height;
    if (aspectRatio < containerAspectRatio) {
      return {
        height: containerDims.height,
        width: containerDims.height * aspectRatio,
      };
    } else {
      return {
        width: containerDims.width,
        height: containerDims.width / aspectRatio,
      };
    }
  }, [containerDims, activeMediaDimensions]);

  function setHoveredBox(e: React.PointerEvent) {
    const boxes = document.querySelectorAll('.bbox');
    const dimensionsAndIndex = Array.from(boxes).map((box, i) => {
      const {top, left, width, height} = box.getBoundingClientRect();
      return {
        top,
        left,
        width,
        height,
        index: i,
      };
    });
    // Sort smallest to largest
    const sorted = dimensionsAndIndex.sort(
      (a, b) => a.width * a.height - b.width * b.height,
    );
    // Find the smallest box that contains the mouse
    const {clientX, clientY} = e;
    const found = sorted.find(({top, left, width, height}) => {
      return (
        clientX > left &&
        clientX < left + width &&
        clientY > top &&
        clientY < top + height
      );
    });
    if (found) {
      _setHoveredBox(found.index);
    } else {
      _setHoveredBox(null);
    }
  }

  const downRef = useRef<Boolean>(false);

  const lineOptions = useMemo(
    () => ({
      size: lineThickness,
      thinning: 0,
      smoothing: 0,
      streamline: 0,
      simulatePressure: false,
    }),
    [lineThickness],
  );

  const updateLabel = (
    type: '2d' | 'mask' | 'point',
    index: number,
    newLabel: string,
  ) => {
    if (type === '2d') {
      setBoundingBoxes2D((boxes) =>
        boxes.map((box, i) => (i === index ? {...box, label: newLabel} : box)),
      );
    } else if (type === 'mask') {
      setBoundingBoxMasks((masks) =>
        masks.map((mask, i) => (i === index ? {...mask, label: newLabel} : mask)),
      );
    } else if (type === 'point') {
      setPoints((points) =>
        points.map((point, i) =>
          i === index ? {...point, label: newLabel} : point,
        ),
      );
    }
  };

  const handleLabelEdit = () => {
    if (editingState) {
      updateLabel(editingState.type, editingState.index, editingText);
      setEditingState(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelEdit();
    } else if (e.key === 'Escape') {
      setEditingState(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full grow relative">
      {stream ? (
        <video
          className="absolute top-0 left-0 w-full h-full object-contain"
          autoPlay
          onLoadedMetadata={(e) => {
            setActiveMediaDimensions({
              width: e.currentTarget.videoWidth,
              height: e.currentTarget.videoHeight,
            });
          }}
          ref={(video) => {
            videoRef.current = video;
            if (video && !video.srcObject) {
              video.srcObject = stream;
            }
          }}
        />
      ) : imageSrc ? (
        <img
          src={imageSrc}
          className="absolute top-0 left-0 w-full h-full object-contain"
          alt="Uploaded image"
          onLoad={(e) => {
            setActiveMediaDimensions({
              width: e.currentTarget.naturalWidth,
              height: e.currentTarget.naturalHeight,
            });
          }}
        />
      ) : null}
      <div
        className={`absolute w-full h-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${hoverEntered ? 'hide-box' : ''} ${drawMode ? 'cursor-crosshair' : ''}`}
        ref={boundingBoxContainerRef}
        onPointerEnter={(e) => {
          if (revealOnHover && !drawMode) {
            setHoverEntered(true);
            setHoveredBox(e);
          }
        }}
        onPointerMove={(e) => {
          if (revealOnHover && !drawMode) {
            setHoverEntered(true);
            setHoveredBox(e);
          }
          if (downRef.current) {
            const parentBounds =
              boundingBoxContainerRef.current!.getBoundingClientRect();
            setLines((prev) => [
              ...prev.slice(0, prev.length - 1),
              [
                [
                  ...prev[prev.length - 1][0],
                  [
                    (e.clientX - parentBounds.left) /
                      boundingBoxContainer!.width,
                    (e.clientY - parentBounds.top) /
                      boundingBoxContainer!.height,
                  ],
                ],
                prev[prev.length - 1][1],
              ],
            ]);
          }
        }}
        onPointerLeave={(e) => {
          if (revealOnHover && !drawMode) {
            setHoverEntered(false);
            setHoveredBox(e);
          }
        }}
        onPointerDown={(e) => {
          if (drawMode) {
            setImageSent(false);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            downRef.current = true;
            const parentBounds =
              boundingBoxContainerRef.current!.getBoundingClientRect();
            setLines((prev) => [
              ...prev,
              [
                [
                  [
                    (e.clientX - parentBounds.left) /
                      boundingBoxContainer!.width,
                    (e.clientY - parentBounds.top) /
                      boundingBoxContainer!.height,
                  ],
                ],
                activeColor,
              ],
            ]);
          }
        }}
        onPointerUp={(e) => {
          if (drawMode) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            downRef.current = false;
          }
        }}
        style={{
          width: boundingBoxContainer.width,
          height: boundingBoxContainer.height,
        }}>
        {lines.length > 0 && (
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{
              pointerEvents: 'none',
              width: boundingBoxContainer?.width,
              height: boundingBoxContainer?.height,
            }}>
            {lines.map(([points, color], i) => (
              <path
                key={i}
                d={getSvgPathFromStroke(
                  getStroke(
                    points.map(([x, y]) => [
                      x * boundingBoxContainer!.width,
                      y * boundingBoxContainer!.height,
                      0.5,
                    ]),
                    lineOptions,
                  ),
                )}
                fill={color}
              />
            ))}
          </svg>
        )}
        {detectType === '2D bounding boxes' &&
          boundingBoxes2D.map((box, i) => {
            const color = stringToHslColor(box.label, 80, 50);
            return (
              <div
                key={i}
                className={`absolute bbox border-2 ${i === hoveredBox ? 'reveal' : ''} ${!showBoxes ? 'border-transparent' : ''}`}
                style={{
                  borderColor: color,
                  transformOrigin: '0 0',
                  top: box.y * 100 + '%',
                  left: box.x * 100 + '%',
                  width: box.width * 100 + '%',
                  height: box.height * 100 + '%',
                }}>
                {showLabels && (
                  <div
                    className="text-white absolute left-0 top-0 text-sm px-1 cursor-pointer"
                    style={{backgroundColor: color}}
                    onClick={() => {
                      setEditingState({type: '2d', index: i});
                      setEditingText(box.label);
                    }}>
                    {editingState?.type === '2d' &&
                    editingState.index === i ? (
                      <input
                        type="text"
                        value={editingText}
                        className="bg-transparent text-white text-sm p-0 w-full outline-none"
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleLabelEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                      />
                    ) : (
                      box.label
                    )}
                  </div>
                )}
              </div>
            );
          })}
        {detectType === 'Segmentation masks' &&
          boundingBoxMasks.map((box, i) => {
            const color = stringToHslColor(box.label, 80, 50);
            return (
              <div
                key={i}
                className={`absolute bbox border-2 ${i === hoveredBox ? 'reveal' : ''} ${!showBoxes ? 'border-transparent' : ''}`}
                style={{
                  borderColor: color,
                  transformOrigin: '0 0',
                  top: box.y * 100 + '%',
                  left: box.x * 100 + '%',
                  width: box.width * 100 + '%',
                  height: box.height * 100 + '%',
                }}>
                <BoxMask box={box} index={i} />
                {showLabels && (
                  <div className="w-full top-0 h-0 absolute">
                    <div
                      className="text-white absolute -left-[2px] bottom-0 text-sm px-1 cursor-pointer"
                      style={{backgroundColor: color}}
                      onClick={() => {
                        setEditingState({type: 'mask', index: i});
                        setEditingText(box.label);
                      }}>
                      {editingState?.type === 'mask' &&
                      editingState.index === i ? (
                        <input
                          type="text"
                          value={editingText}
                          className="bg-transparent text-white text-sm p-0 w-full outline-none"
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={handleLabelEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      ) : (
                        box.label
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {detectType === 'Points' &&
          points.map((point, i) => {
            const color = stringToHslColor(point.label, 80, 50);
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${point.point.x * 100}%`,
                  top: `${point.point.y * 100}%`,
                }}>
                {showLabels && (
                  <div
                    className="absolute text-center text-white text-xs px-1 bottom-4 rounded-sm -translate-x-1/2 left-1/2 cursor-pointer"
                    style={{backgroundColor: color}}
                    onClick={() => {
                      setEditingState({type: 'point', index: i});
                      setEditingText(point.label);
                    }}>
                    {editingState?.type === 'point' &&
                    editingState.index === i ? (
                      <input
                        type="text"
                        value={editingText}
                        className="bg-transparent text-white text-xs p-0 w-full outline-none"
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleLabelEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                      />
                    ) : (
                      point.label
                    )}
                  </div>
                )}
                <div
                  className="absolute w-4 h-4 rounded-full border-white border-[2px] -translate-x-1/2 -translate-y-1/2"
                  style={{backgroundColor: color}}></div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function BoxMask({
  box,
  index,
}: {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    imageData: string;
  };
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rgb = segmentationColorsRgb[index % segmentationColorsRgb.length];

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const image = new Image();
        image.src = box.imageData;
        image.onload = () => {
          canvasRef.current!.width = image.width;
          canvasRef.current!.height = image.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, image.width, image.height);
          const data = pixels.data;
          for (let i = 0; i < data.length; i += 4) {
            // alpha from mask
            data[i + 3] = data[i];
            // color from palette
            data[i] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
          }
          ctx.putImageData(pixels, 0, 0);
        };
      }
    }
  }, [canvasRef, box.imageData, rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{opacity: 0.5}}
    />
  );
}
