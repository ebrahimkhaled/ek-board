/**
 * index.js — EK-Board Annotation Engine (Modular)
 * Thin orchestrator that imports from render, persist, toolbar, and tools.
 */
export { initAnnotations, onExerciseChange, isToolActive, shouldNavigate, isPenActive, getCurrentTool, undoAnnotation, redoAnnotation, setAnnotationTool, toggleVisibility, clearAnnotations, flushToCloud, toggleDebug, globalSettings } from './engine.js';
