import { combineReducers } from 'redux';

import activeAccount from './active-account/reducer';
import attachmentPreview from './attachment-preview/reducer';
import calendar from './calendar/reducer';
import contacts from './contacts/reducer';
import dragdrop from './dragdrop/reducer';
import email from './email/reducer';
import entities from './entities/reducer';
import folders from './folders/reducer';
import mail from './mail/reducer';
import mediaMenu from './media-menu/reducer';
import navigation from './navigation/reducer';
import notifications from './notifications/reducer';
import settings from './settings/reducer';
import sidebar from './sidebar/reducer';
import url from './url/reducer';

export default function createReducer(additionalReducers = {}) {
	return combineReducers({
		...additionalReducers,
		activeAccount,
		attachmentPreview,
		calendar,
		contacts,
		dragdrop,
		email,
		entities,
		folders,
		mail,
		mediaMenu,
		navigation,
		notifications,
		settings,
		sidebar,
		url
	});
}
