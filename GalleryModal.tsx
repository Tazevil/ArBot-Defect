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
  GalleryModalOpenAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  imageOptionsAtom,
} from './atoms';
import {useResetState} from './hooks';

export function GalleryModal() {
  const [imageOptions] = useAtom(imageOptionsAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setGalleryModalOpen] = useAtom(GalleryModalOpenAtom);
  const resetState = useResetState();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={() => setGalleryModalOpen(false)}>
      <div
        className="bg-[var(--bg-color)] p-6 rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Images d'exemple</h2>
          <button
            onClick={() => setGalleryModalOpen(false)}
            className="p-1 !border-none text-2xl">
            &times;
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageOptions.map((image) => (
            <button
              key={image}
              className="p-0 aspect-square relative overflow-hidden"
              onClick={() => {
                setIsUploadedImage(false);
                setImageSrc(image);
                resetState();
                setGalleryModalOpen(false);
              }}>
              <img
                src={image}
                className="absolute left-0 top-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
