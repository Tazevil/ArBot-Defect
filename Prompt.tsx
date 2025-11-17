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

import {GoogleGenAI} from '@google/genai';
import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {useMemo, useState} from 'react';
import {
  BoundingBoxMasksAtom,
  BoundingBoxes2DAtom,
  CustomPromptsAtom,
  DetectTypeAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  IsLoadingAtom,
  LinesAtom,
  LineThicknessAtom,
  PointsAtom,
  PromptModalOpenAtom,
  PromptsAtom,
  ShareStream,
  TemperatureAtom,
  VideoRefAtom,
} from './atoms';
import {DetectTypes} from './Types';
import {getSvgPathFromStroke, loadImage} from './utils';

// FIX: Use the correct environment variable for the API key as per guidelines.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [lineThickness] = useAtom(LineThicknessAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [prompts, setPrompts] = useAtom(PromptsAtom);
  const [customPrompts, setCustomPrompts] = useAtom(CustomPromptsAtom);
  const [isLoading, setIsLoading] = useAtom(IsLoadingAtom);
  const [, setPromptModalOpen] = useAtom(PromptModalOpenAtom);

  const is2d = detectType === '2D bounding boxes';
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [targetPrompt, setTargetPrompt] = useState(
    prompts['2D bounding boxes'][1],
  );
  const [labelPrompt, setLabelPrompt] = useState('');
  const [segmentationLanguage, setSegmentationLanguage] = useState('Français');
  const [showRawPrompt, setShowRawPrompt] = useState(false);

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

  const get2dPrompt = () =>
    `Détectez ${targetPrompt}, avec un maximum de 20 éléments. Sortez une liste json où chaque entrée contient la boîte englobante 2D dans "box_2d" et ${
      labelPrompt || 'une étiquette de texte'
    } dans "label".`;

  const getSegmentationPrompt = () => {
    const promptParts = prompts['Segmentation masks'];
    const prefix = promptParts[0];
    const items = promptParts[1]; // User-editable "items"
    let suffix = promptParts[2];

    const originalLabelInstruction =
      ' l\'étiquette de texte dans la clé "label". Utiliser des étiquettes descriptives.';

    if (
      segmentationLanguage &&
      segmentationLanguage.trim() !== '' &&
      segmentationLanguage.toLowerCase() !== 'français'
    ) {
      if (suffix.endsWith(originalLabelInstruction)) {
        suffix = suffix.substring(
          0,
          suffix.length - originalLabelInstruction.length,
        );
      }
      suffix += ` l'étiquette de texte en langue ${segmentationLanguage} dans la clé "label". Utiliser des étiquettes descriptives en ${segmentationLanguage}. S'assurer que les étiquettes sont en ${segmentationLanguage}.`;
    }
    return `${prefix} ${items}${suffix}`;
  };

  const getGenericPrompt = (type: DetectTypes) => {
    if (!prompts[type] || prompts[type].length < 3)
      return prompts[type]?.join(' ') || '';
    const [p0, p1, p2] = prompts[type];
    return `${p0} ${p1}${p2}`;
  };

  async function handleSend() {
    setIsLoading(true);
    try {
      let activeDataURL;
      const maxSize = 640;
      const copyCanvas = document.createElement('canvas');
      const ctx = copyCanvas.getContext('2d')!;

      if (stream) {
        // screenshare
        const video = videoRef.current!;
        const scale = Math.min(
          maxSize / video.videoWidth,
          maxSize / video.videoHeight,
        );
        copyCanvas.width = video.videoWidth * scale;
        copyCanvas.height = video.videoHeight * scale;
        ctx.drawImage(
          video,
          0,
          0,
          video.videoWidth * scale,
          video.videoHeight * scale,
        );
      } else if (imageSrc) {
        const image = await loadImage(imageSrc);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        copyCanvas.width = image.width * scale;
        copyCanvas.height = image.height * scale;
        console.log(copyCanvas);
        ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
      }
      activeDataURL = copyCanvas.toDataURL('image/png');

      if (lines.length > 0) {
        for (const line of lines) {
          const p = new Path2D(
            getSvgPathFromStroke(
              getStroke(
                line[0].map(([x, y]) => [
                  x * copyCanvas.width,
                  y * copyCanvas.height,
                  0.5,
                ]),
                lineOptions,
              ),
            ),
          );
          ctx.fillStyle = line[1];
          ctx.fill(p);
        }
        activeDataURL = copyCanvas.toDataURL('image/png');
      }

      setHoverEntered(false);
      const config: {
        temperature: number;
        thinkingConfig?: {thinkingBudget: number};
      } = {
        temperature,
      };
      // FIX: Use recommended gemini-2.5-flash model consistently.
      const model = 'gemini-2.5-flash';
      // Disable thinking for 2.5 Flash, as recommended for spatial
      // understanding tasks.
      config['thinkingConfig'] = {thinkingBudget: 0};

      let textPromptToSend = '';
      if (showCustomPrompt) {
        textPromptToSend = customPrompts[detectType];
      } else if (is2d) {
        textPromptToSend = get2dPrompt();
      } else if (detectType === 'Segmentation masks') {
        textPromptToSend = getSegmentationPrompt();
      } else {
        textPromptToSend = getGenericPrompt(detectType);
      }
      // FIX: Use correct payload structure for generateContent and handle response correctly.
      const result = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: activeDataURL.replace('data:image/png;base64,', ''),
                  mimeType: 'image/png',
                },
              },
              {text: textPromptToSend},
            ],
          },
        ],
        config,
      });
      let response = result.text;

      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0];
      }
      const parsedResponse = JSON.parse(response);
      if (detectType === '2D bounding boxes') {
        const formattedBoxes = parsedResponse.map(
          (box: {box_2d: [number, number, number, number]; label: string}) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: box.label,
            };
          },
        );
        setHoverEntered(false);
        setBoundingBoxes2D(formattedBoxes);
      } else if (detectType === 'Points') {
        const formattedPoints = parsedResponse.map(
          (point: {point: [number, number]; label: string}) => {
            return {
              point: {
                x: point.point[1] / 1000,
                y: point.point[0] / 1000,
              },
              label: point.label,
            };
          },
        );
        setPoints(formattedPoints);
      } else if (detectType === 'Segmentation masks') {
        const formattedBoxes = parsedResponse.map(
          (box: {
            box_2d: [number, number, number, number];
            label: string;
            mask: ImageData;
          }) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: box.label,
              imageData: box.mask,
            };
          },
        );
        setHoverEntered(false);
        // sort largest to smallest
        const sortedBoxes = formattedBoxes.sort(
          (a: any, b: any) => b.width * b.height - a.width * a.height,
        );
        setBoundingBoxMasks(sortedBoxes);
      }
    } finally {
      setIsLoading(false);
      setPromptModalOpen(false);
    }
  }

  return (
    <div className="flex grow flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="uppercase">
          Prompt: Gemini 2.5 Flash (sans réflexion)
        </div>
        <div className="flex gap-4">
          <label className="flex gap-2 select-none">
            <input
              type="checkbox"
              checked={showCustomPrompt}
              onChange={() => setShowCustomPrompt(!showCustomPrompt)}
              disabled={isLoading}
            />
            <div>prompt personnalisé</div>
          </label>
          <label className="flex gap-2 select-none">
            <input
              type="checkbox"
              checked={showRawPrompt}
              onChange={() => setShowRawPrompt(!showRawPrompt)}
              disabled={isLoading}
            />
            <div>afficher le prompt brut</div>
          </label>
        </div>
      </div>
      <div className="w-full flex flex-col">
        {showCustomPrompt ? (
          <textarea
            className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
            value={customPrompts[detectType]}
            rows={5}
            onChange={(e) => {
              const value = e.target.value;
              const newPrompts = {...customPrompts};
              newPrompts[detectType] = value;
              setCustomPrompts(newPrompts);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
          />
        ) : showRawPrompt ? (
          <div className="mb-2 text-[var(--text-color-secondary)]">
            {is2d
              ? get2dPrompt()
              : detectType === 'Segmentation masks'
                ? getSegmentationPrompt()
                : getGenericPrompt(detectType)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div>{is2d ? 'Détecter' : prompts[detectType][0]}</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
              placeholder="Quels types d'objets voulez-vous détecter ?"
              rows={1}
              value={is2d ? targetPrompt : prompts[detectType][1]}
              onChange={(e) => {
                if (is2d) {
                  setTargetPrompt(e.target.value);
                } else {
                  const value = e.target.value;
                  const newPromptsState = {...prompts};
                  if (!newPromptsState[detectType])
                    newPromptsState[detectType] = ['', '', ''];
                  newPromptsState[detectType][1] = value;
                  setPrompts(newPromptsState);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            {detectType === 'Segmentation masks' && (
              <>
                <div className="mt-1">
                  Langue des étiquettes : (ex: English, Deutsch, Español, 中文)
                </div>
                <textarea
                  aria-label="Language for segmentation labels"
                  className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
                  rows={1}
                  placeholder="ex: Anglais, Allemand, Espagnol"
                  value={segmentationLanguage}
                  onChange={(e) => setSegmentationLanguage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                />
              </>
            )}
            {is2d && (
              <>
                <div>Étiquetez chacun avec : (optionnel)</div>
                <textarea
                  className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
                  rows={1}
                  placeholder="Comment voulez-vous étiqueter les objets ?"
                  value={labelPrompt}
                  onChange={(e) => setLabelPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                />
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <button
          className={`bg-[#3B68FF] px-12 !text-white !border-none flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSend}
          disabled={isLoading}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </>
          ) : (
            'Envoyer'
          )}
        </button>
        <label className="flex items-center gap-2">
          température:
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            disabled={isLoading}
          />
          {temperature.toFixed(2)}
        </label>
      </div>
    </div>
  );
}
