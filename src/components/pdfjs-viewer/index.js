import split from '../../lib/split-point';
import load from 'bundle-loader?name=pdfjs-viewer&lazy!./pdfjs-viewer';

export default split(load);

