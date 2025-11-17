/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may not obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {useAtom} from 'jotai';
// FIX: Add explicit return type to prevent incorrect type inference.
// useCallback is used to memoize the reset function, ensuring it has a stable identity across re-renders.
// This prevents unnecessary re-renders in child components and can resolve subtle type inference issues.
import {useCallback} from 'react';
import {
  BoundingBoxes2DAtom,
  BoundingBoxMasksAtom,
  BumpSessionAtom,
  ImageSentAtom,
  PointsAtom,
} from './atoms';

// FIX: Add explicit return type to prevent incorrect type inference.
export function useResetState(): () => void {
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);

  return useCallback(() => {
    setImageSent(false);
    setBoundingBoxes2D([]);
    setBoundingBoxMasks([]);
    setBumpSession((prev) => prev + 1);
    setPoints([]);
  }, [
    setImageSent,
    setBoundingBoxes2D,
    setBoundingBoxMasks,
    setPoints,
    setBumpSession,
  ]);
}
