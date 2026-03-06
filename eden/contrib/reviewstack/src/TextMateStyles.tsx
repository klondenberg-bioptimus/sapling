/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {colorMapAtom} from './diffServiceClient';
import {primerColorModeAtom} from './jotai/atoms';
import {useAtomValue} from 'jotai';
import React, {Component, Suspense, useEffect, useMemo} from 'react';
import {updateTextMateGrammarCSS} from 'shared/textmate-lib/textmateStyles';

/**
 * Error boundary that silently swallows errors. Used to make TextMate syntax
 * highlighting a best-effort feature: if the SharedWorker or WASM loading
 * fails, the rest of the app continues to work without syntax highlighting.
 */
class SilentErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): {hasError: boolean} {
    return {hasError: true};
  }

  componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.warn('TextMate syntax highlighting unavailable:', error.message);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Component that ensures TextMate syntax highlighting CSS is injected into
 * the DOM. It fetches the colorMap from the diff service worker and calls
 * updateTextMateGrammarCSS() to create CSS rules for the tokenization classes
 * (e.g., .mtk1, .mtk2, etc.).
 */
// eslint-disable-next-line prefer-arrow-callback
export default React.memo(function TextMateStyles(): React.ReactElement | null {
  return (
    <SilentErrorBoundary>
      <Suspense fallback={null}>
        <TextMateStylesInner />
      </Suspense>
    </SilentErrorBoundary>
  );
});

function TextMateStylesInner(): React.ReactElement | null {
  const colorMode = useAtomValue(primerColorModeAtom);
  const colorAtom = useMemo(() => colorMapAtom(colorMode), [colorMode]);
  const colors = useAtomValue(colorAtom);

  useEffect(() => {
    updateTextMateGrammarCSS(colors);
  }, [colors]);

  return null;
}
