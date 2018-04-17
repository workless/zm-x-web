import style from './style';
import { COMMAND_TYPE } from './index';
import { FONT_FAMILY, FONT_SIZE } from '../../../../constants/fonts';

export function generateFontMenu(cmd, { exec }) {
	return cmd('font', null, COMMAND_TYPE.MENU, {
		watch: true,
		title: 'fontsTitle',
		submenu: [
			{
				command: 'fontName',
				getCurrentValue: () =>  {
					// Caution: queryCommandValue will return the fontName of the focused element, not the rich text area.
					let currentFontName = exec('queryCommandValue', 'fontName');
					let val = FONT_FAMILY.filter(font => font.value.indexOf(currentFontName) > -1 );
					return val.length ? val[0].value : FONT_FAMILY[0].value;
				},
				menuItems: FONT_FAMILY.map(({ label, value }) => cmd(
					null,
					'fontName',
					COMMAND_TYPE.NORMAL,
					{
						label,
						value,
						style: `font-family:${value}; font-size:13px;`
					}
				))
			},
			{
				command: 'fontSize',
				getCurrentValue: () =>  {
					// Caution: queryCommandValue will return the fontSize of the focused element, not the rich text area.
					let currentFontSize = exec('queryCommandValue', 'fontSize');
					return currentFontSize ? parseInt(currentFontSize, 10) : 2;
				},
				menuItems: FONT_SIZE.map(({ label, value }) => cmd(
					null,
					'fontSize',
					COMMAND_TYPE.NORMAL,
					{
						label,
						value,
						class: style[`fontSize${value}`],
						style: `line-height:1.5;`
					}
				))
			}
		]
	});
}
