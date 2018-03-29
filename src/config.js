import config from '../clients/default/config.json';
import preconf from 'preconf';

export default config;
export const configure = preconf(null, config);
