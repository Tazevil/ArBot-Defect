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
import {
  DrawModeAtom,
  HoveredBoxAtom,
  LinesAtom,
  LineThicknessAtom,
  ShareStream,
} from './atoms';
import {Palette} from './Palette';
// FIX: Use the useResetState hook for consistency.
import {useResetState} from './hooks';

export function ExtraModeControls() {
  const [stream, setStream] = useAtom(ShareStream);
  const [, _setHoveredBox] = useAtom(HoveredBoxAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setLines] = useAtom(LinesAtom);
  const [lineThickness, setLineThickness] = useAtom(LineThicknessAtom);
  const resetState = useResetState();

  const showExtraBar = stream;

  return (
    <>
      {drawMode ? (
        <div className="flex gap-3 px-3 py-3 items-center justify-between border-t">
          <div style={{width: 200}}></div>
          <div className="grow flex justify-center items-center gap-4">
            <Palette />
            <div className="flex items-center gap-2">
              <div>Épaisseur</div>
              <input
                type="range"
                min="1"
                max="32"
                value={lineThickness}
                onChange={(e) => setLineThickness(Number(e.target.value))}
              />
              <div>{lineThickness}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-3">
              <button
                className="flex gap-3 text-sm secondary"
                onClick={() => {
                  setLines([]);
                }}>
                <div className="text-xs">🗑️</div>
                Effacer
              </button>
            </div>
            <div className="flex gap-3">
              <button
                className="flex gap-3 secondary"
                onClick={() => {
                  setDrawMode(false);
                }}>
                <div className="text-sm">✅</div>
                <div>Terminé</div>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showExtraBar ? (
        <div className="flex gap-3 px-3 py-3 border-t items-center justify-center">
          {stream ? (
            <button
              className="flex gap-3 text-sm items-center secondary"
              onClick={() => {
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
                resetState();
              }}>
              <div className="text-xs">🔴</div>
              <div className="whitespace-nowrap">Arrêter le partage</div>
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
