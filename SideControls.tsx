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
import {useState} from 'react';
import {
  BumpSessionAtom,
  DrawModeAtom,
  GalleryVisibleAtom,
  ImageSentAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  PromptModalOpenAtom,
} from './atoms';
import {useResetState} from './hooks';

export function SideControls() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [galleryVisible, setGalleryVisible] = useAtom(GalleryVisibleAtom);
  const [, setPromptModalOpen] = useAtom(PromptModalOpenAtom);
  const [showDriveInput, setShowDriveInput] = useState(false);
  const resetState = useResetState();

  const handleFetchFromDrive = () => {
    // A full Google Drive integration requires OAuth2 and the Google Drive API.
    // This is a placeholder for fetching from a *public* folder.
    // The user would need to provide a URL to a folder that is shared "publicly on the web".
    // Logic to parse the URL and fetch file IDs would be needed here.
    alert(
      "L'importation depuis Google Drive est une fonctionnalité de démonstration. Une implémentation complète nécessite des clés API et une authentification utilisateur.",
    );
  };

  return (
    <div className="flex flex-row gap-3 items-center">
      <label className="flex items-center button bg-[#3B68FF] px-6 !text-white !border-none whitespace-nowrap">
        <input
          className="hidden"
          type="file"
          accept=".jpg, .jpeg, .png, .webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                resetState();
                setImageSrc(e.target?.result as string);
                setIsUploadedImage(true);
                setImageSent(false);
                setBumpSession((prev) => prev + 1);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <div>Télécharger une image</div>
      </label>
      <button
        className="button flex gap-3 justify-center items-center"
        onClick={() => {
          setGalleryVisible(!galleryVisible);
        }}>
        <div className="text-lg">🖼️</div>
        <div>{galleryVisible ? 'Masquer la galerie' : 'Afficher la galerie'}</div>
      </button>
      <button
        className="button flex gap-3 justify-center items-center"
        onClick={() => setPromptModalOpen(true)}>
        <div className="text-lg">⚙️</div>
        <div>Configurer le Prompt</div>
      </button>
      <div className="relative">
        <button
          className="button flex gap-3 justify-center items-center"
          onClick={() => setShowDriveInput(!showDriveInput)}>
          <div className="text-lg">📁</div>
          <div>Importer de Drive</div>
        </button>
        {showDriveInput && (
          <div className="flex flex-col gap-2 absolute bottom-full mb-2 bg-[var(--bg-color)] p-2 border rounded-lg shadow-lg">
            <input
              type="text"
              placeholder="URL du dossier public Google Drive"
              className="w-full bg-[var(--input-color)] rounded-lg p-2 text-sm"
            />
            <button className="secondary text-sm" onClick={handleFetchFromDrive}>
              Charger les images
            </button>
          </div>
        )}
      </div>
      <div className="hidden">
        <button
          className="button flex gap-3 justify-center items-center"
          onClick={() => {
            setDrawMode(!drawMode);
          }}>
          <div className="text-lg"> 🎨</div>
          <div>Dessiner sur l'image</div>
        </button>
      </div>
    </div>
  );
}
