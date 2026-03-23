import '@testing-library/jest-dom';

// react-router v7 uses Web APIs not available in Jest 27 / jsdom by default
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });
