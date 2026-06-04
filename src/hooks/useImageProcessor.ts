/**
 * useImageProcessor hook - Pure synchronous processing (no Web Worker).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ProcessOptions, ProcessResult } from '../engine/types';
import { processImage } from '../engine/quantize';

interface ProcessorState {
  result: ProcessResult | null;
  isProcessing: boolean;
  error: string | null;
}

export function useImageProcessor() {
  const [state, setState] = useState<ProcessorState>({
    result: null, isProcessing: false, error: null,
  });

  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentImageRef = useRef<HTMLImageElement | null>(null);
  const currentOptionsRef = useRef<ProcessOptions | null>(null);

  useEffect(() => {
    return () => {
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    };
  }, []);

  const process = useCallback((image: HTMLImageElement, options: ProcessOptions) => {
    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    currentImageRef.current = image;
    currentOptionsRef.current = options;
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    processTimeoutRef.current = setTimeout(async () => {
      try {
        await new Promise((r) => setTimeout(r, 10));
        const result = await processImage(image, options);
        setState({ result, isProcessing: false, error: null });
      } catch (err) {
        console.error('Processing error:', err);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: err instanceof Error ? err.message : '处理失败',
        }));
      }
    }, 500);
  }, []);

  const reprocess = useCallback((options: ProcessOptions) => {
    if (!currentImageRef.current) return;
    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    processTimeoutRef.current = setTimeout(async () => {
      try {
        await new Promise((r) => setTimeout(r, 10));
        const result = await processImage(currentImageRef.current!, options);
        setState({ result, isProcessing: false, error: null });
      } catch (err) {
        console.error('Re-processing error:', err);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: err instanceof Error ? err.message : '处理失败',
        }));
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    currentImageRef.current = null;
    currentOptionsRef.current = null;
    setState({ result: null, isProcessing: false, error: null });
  }, []);

  return {
    result: state.result,
    isProcessing: state.isProcessing,
    error: state.error,
    process,
    reprocess,
    clear,
  };
}
