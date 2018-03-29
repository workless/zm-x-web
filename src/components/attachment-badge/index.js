import { h } from 'preact';
import cx from 'classnames';
import { Icon, Card } from '@zimbra/blocks';
import getContentTypeExtension from '../../lib/get-content-type-extension';
import style from './style';

const icons = {
	pdf: 'file-pdf-o',
	xls: 'file-excel-o',
	zip: 'file-archive-o',
	doc: 'file-word-o',
	ppt: 'file-powerpoint-o',
	undefined: 'paperclip'
};

const ContentTypeIcon = ({ contentType, ...props }) => (
	<Icon
		{...props}
		class={cx(style.contentTypeIcon, props.class)}
		name={icons[getContentTypeExtension(contentType)]}
	/>
);

const AttachmentBadge = ({ contentType, ...props }) => (
	<Card {...props} scrim={false}>
		<div>
			<ContentTypeIcon contentType={contentType} />
		</div>
	</Card>
);

export default AttachmentBadge;
