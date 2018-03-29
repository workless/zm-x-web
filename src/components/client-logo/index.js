import { h } from 'preact';
import style from './style';
import cx from 'classnames';
import Markup from 'preact-markup';

export default (function getLogo() {
	try {
		const html = require(`!!svg-inline-loader!../../../clients/${CLIENT}/assets/logo.svg`);
		return function ClientLogo(props) {
			return <span {...props} class={cx(style.logo, props.class)}><Markup markup={html} /></span>;
		};
	}
	catch (e) {
		console.warn(`Could not find "${CLIENT}/assets/logo.svg": `, e);
		return function ClientLogoError() {
			return <span><img alt="Brand Logo Missing" height="30" /></span>;
		};
	}
})();
