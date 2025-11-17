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
import {PromptModalOpenAtom} from './atoms';
import {DetectTypeSelector} from './DetectTypeSelector';
import {Prompt} from './Prompt';

export function PromptModal() {
  const [, setPromptModalOpen] = useAtom(PromptModalOpenAtom);
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={() => setPromptModalOpen(false)}>
      <div
        className="bg-[var(--bg-color)] p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Configurer le Prompt</h2>
          <button
            onClick={() => setPromptModalOpen(false)}
            className="p-1 !border-none text-2xl">
            &times;
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <DetectTypeSelector />
          <Prompt />
        </div>
      </div>
    </div>
  );
}
