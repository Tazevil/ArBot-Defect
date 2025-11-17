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

import {atom} from 'jotai';
import {colors, defaultPromptParts, defaultPrompts} from './consts';
import {
  BoundingBox2DType,
  BoundingBoxMaskType,
  DetectTypes,
} from './Types';

// FIX: Initialize to null and populate asynchronously in App.tsx to avoid top-level await.
export const ImageSrcAtom = atom<string | null>(null);
export const imageOptionsAtom = atom<string[]>([]);

export const ImageSentAtom = atom(false);

export const BoundingBoxes2DAtom = atom<BoundingBox2DType[]>([]);

export const PromptsAtom = atom<Record<DetectTypes, string[]>>({
  ...defaultPromptParts,
});
export const CustomPromptsAtom = atom<Record<DetectTypes, string>>({
  ...defaultPrompts,
});

export type PointingType = {
  point: {
    x: number;
    y: number;
  };
  label: string;
};

export const RevealOnHoverModeAtom = atom<boolean>(true);

export const BoundingBoxMasksAtom = atom<BoundingBoxMaskType[]>([]);

export const PointsAtom = atom<PointingType[]>([]);

export const TemperatureAtom = atom<number>(0.5);

export const ShareStream = atom<MediaStream | null>(null);

export const DrawModeAtom = atom<boolean>(false);

export const DetectTypeAtom = atom<DetectTypes>('2D bounding boxes');

export const LinesAtom = atom<[[number, number][], string][]>([]);

export const JsonModeAtom = atom(false);

export const ActiveColorAtom = atom(colors[6]);

export const LineThicknessAtom = atom<number>(8);

export const HoverEnteredAtom = atom(false);

export const HoveredBoxAtom = atom<number | null>(null);

export const VideoRefAtom = atom<{current: HTMLVideoElement | null}>({
  current: null,
});

export const InitFinishedAtom = atom(true);

export const BumpSessionAtom = atom(0);

export const IsUploadedImageAtom = atom(false);

export const IsLoadingAtom = atom(false);

// Annotation controls
export const ShowLabelsAtom = atom(true);
export const ShowBoxesAtom = atom(true);

// Gallery controls
export const GalleryVisibleAtom = atom(false);
export const GalleryModalOpenAtom = atom(false);

// Prompt modal controls
export const PromptModalOpenAtom = atom(false);
