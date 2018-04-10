/*eslint new-cap: ["error", { "capIsNew": false }]*/
/*eslint no-mixed-spaces-and-tabs: "off"*/

import { profile } from '../profile/profile';
import { Selector } from 'testcafe';

const clientName = profile.clientName;
const notepadName = profile.notepadName;

class Elements {

    // Login Page Elements
    username = Selector(clientName + '_login').find('#login-form_2-email');
    password = Selector(clientName + '_login').find('#login-form_2-password');
    loginButton = Selector(clientName + '_login').find('button').withText('Sign in');
    clientName = clientName;

    // popover
    blocksPopover = Selector('.blocks_popover_popper');

    // Main page header
    mainHeaderActions = Selector(clientName + '_header-actions_headerActions');

    // Main Page Elements - Navbar, Sidebar, Folder, Context Menu, Progress indicator
	navButtonList = Selector(clientName + '_app-navigation_nav');
    sidebarContentSelector = Selector(clientName + '_sidebar_content');
    progressIndicatorSelector = Selector(clientName + '_progress-indicator_progress');
    folderInput = clientName + '_folder-input_folderInput';
    folderListItemSelector = Selector(clientName + '_folder-list_item');
    folderListCollapsibleControlSelector = Selector(clientName + '_collapsible-control_open');
    foldersGroupToggleSelector = Selector(clientName + '_folder-list_groupToggle'); // Unused selector
    folderToggleSelector = Selector(clientName + '_folder-list_customFolderToggle');
    folderInputContainerSelector = Selector(clientName + '_folder-input_folderInputContainer');
    contextMenusDefaultContainerSelector = Selector(clientName + '_context-menus_defaultContainer');
    contextMenuBackdropSelector = Selector(clientName + '_context-menu_backdrop');
    contextMenuDefaultContainerSelector = Selector(clientName + '_context-menus_defaultContainer');

    // Icon Elements
    iconPlus = '.zimbra-icon-plus';
    iconSearch = '.zimbra-icon-search';
    iconClose = '.zimbra-icon-close';
    angleRight = '.fa-angle-right';
    star = '.fa-star';

    // Mail Elements - Left Pane
    messageItem = clientName + '_mail-list-item_message';
    messageLabel = clientName + '_mail-list-item_label';
    mailSubject = clientName + '_mail-list-item_subject';
    sidebarRefreshButton = Selector(clientName + '_folder-list_refresh');
    // Mail Elements - Right Pane
    condensedMessage = clientName + '_condensed-message_message';
    conversationSectionSelector = Selector(clientName + '_conversation-viewer_section');
    conversationSubjectSelector = Selector(clientName + '_viewer-title_subject');
    mailViewerBodySelector = Selector(clientName + '_viewer_body');
    clientHtmlViewerInner = Selector(clientName + '_html-viewer_inner');
    mailViewerTitleCountText = Selector(clientName + '_viewer-title_countText');
    mailViewPlaceholderView = Selector(clientName + '_viewer-placeholder_placeholder');
    // Mail Elements - Toolbar
    actionButton = clientName + '_action-button_button';
    actionMenuGroup = clientName + '_action-menu-group_group';
    blocksPopoverContainer = '.blocks_popover_popover-container';
    viewerToolbarSelector = Selector(clientName + '_mail-actions_viewerToolbar');
    actionMenuDropDown = Selector(clientName + '_action-menu_dropdown');
    // Mail Elements
    mailListItemMessageSelector = Selector(this.messageItem);
    mailListItemUnread = Selector(clientName + '_mail-list-item_unread');
    inboxReadPane = Selector(clientName + '_mail-pane_readPane');
    mailListPaneSelector = Selector(clientName + '_mail-pane_mailListPane');
    mailListSubjectSelector = this.mailListPaneSelector.find(this.mailSubject); // Refactor
    messageViewerHeaderTextSelector = Selector(clientName + '_viewer-title_headerText');
    mailListFooterSelector = Selector(clientName + '_mail-list-footer_footer');
    addressListAddressDetail = Selector(clientName + '_address-list_addressDetail');
    addressListAddress = Selector(clientName + '_address-list_address');
    addressListAddressType = Selector(clientName + '_address-list_addressType');
    
    // Dialog Elements
    blocksDialogOverlaySelector = Selector('.blocks_dialog_overlay');
    dialogSelector = Selector(clientName + '_modal-dialog_dialog');
    calendarModalDialogButtonSelector = Selector(clientName + '_modal-dialog_footer');


    // Compose - Rich Text Area Elements
    richtextareaContainer = Selector(clientName + '_gui-rich-text-area_relative'); // Refactor
    richtextarea = Selector(clientName + '_gui-rich-text-area_relative'); // Same as above
    richtextToolbarContainer = Selector(clientName + '_gui-rich-text-area_components_toolbar_container');
    componentsToolbarMiddleSelector = Selector(clientName + '_gui-rich-text-area_components_toolbar_middle');
    emojiItemButton = Selector(clientName + '_gui-rich-text-area_components_toolbar_emojiItem');
    componentsToolbarColorMenuSelector = this.componentsToolbarMiddleSelector.find(clientName + '_gui-rich-text-area_components_toolbar_colorMenu'); // Refactor
    rteToolbarDeleteSelector = Selector(clientName + '_gui-rich-text-area_components_toolbar_delete');
    composerScrollContainer = Selector(clientName + '_composer_editor');

    // Compose - Plus Sign Menu Elements
    plusMenuBlockSpinner = Selector('.blocks_spinner_blockSpinner');
    plusSignIcon = Selector(clientName + '_media-menu_icon');
    plusSignMenuTabs = Selector(clientName + '_plus-sign-menu_tabs');
    plusSignMenuNavBar = Selector('.blocks_tabs_nav');
    plusSignMenuNavItem = Selector('.blocks_tabs_nav-item');
    menuSearchSelector = Selector(clientName + '_plus-sign-menu_search');
    plusSignScrollVirtualListSelector = Selector(clientName + '_plus-sign-menu_components_infinite-scroll_virtualList');
    plusSignMenuLabelWithText = labelText => Selector('h4').withText(labelText); // Refactor
    plusSignMenuPhotoFromEmailArea = this.plusSignMenuLabelWithText('Photos from Email').parent('div'); // Refactor
    plusSignMenuFileFromEmailArea = this.plusSignMenuLabelWithText('Files from Email').parent(clientName + '_plus-sign-menu_content'); // Refactor
    plusSignMenuPopularGIFs = this.plusSignMenuLabelWithText('Popular GIFs').parent('div'); // Refactor
    plusSignMenuGifs = this.plusSignMenuLabelWithText('GIFs').parent('div'); // Refactor
    plusSignMenuSearches = this.plusSignMenuLabelWithText('Searches').parent('div'); //Refactor
    plusSignMenuPhotoFromEmailAreaItemButton = this.plusSignMenuPhotoFromEmailArea.find('.blocks_card_square').withAttribute('role', 'button'); //Refactor
    plusSignMenuFileFromEmailAreaItemButton = this.plusSignMenuFileFromEmailArea.find('*').withAttribute('draggable','true').withAttribute('role', 'button'); //Refactor
    plusSignMenuPopularGIFsItemButton = this.plusSignMenuPopularGIFs.find('.blocks_card_square').withAttribute('role', 'button'); //Refactor
    plusSignMenuSearchesItemButton = this.plusSignMenuSearches.find('*').withAttribute('draggable','true').withAttribute('role', 'button'); //Refactor
    plusSignMenuGifsItemButton = this.plusSignMenuGifs.find('.blocks_card_square').withAttribute('role', 'button'); //Refactor
    

    //Compose Elements
    buttonWithText = buttonText => Selector('button').withText(buttonText); // Refactor
    composerSelector = Selector(clientName + '_composer');
    composeHeader = Selector(clientName + '_composer_header');
    composerField = Selector(clientName + '_composer_fields');
    composerFooter = Selector(clientName + '_composer_footer');
    composeButton = Selector(clientName + '_compose-button_composeButton');
    richtextareaToolbarItems = Selector(clientName + '_gui-richtextarea_components_toolbar_left');
    ccInputField = Selector('input[type="text"][placeholder="Cc:"]');
    bccInputField = Selector('input[type="text"][placeholder="Bcc:"]');
    closeButton = Selector(clientName + '_composer_closeButton');
    composerBody = Selector(clientName + '_composer_body');
    attachedFileList = Selector(clientName + '_attachment');
    searchField = Selector('input[placeholder="Search photos"]');
    buttonListAddressFieldTokenLabel = Selector(clientName + '_address-field_tokenLabel');
    addressFieldSuggestions = Selector(clientName + '_contact-suggestion_suggestion');
    blocksTooltip = Selector('.blocks_tooltip').withAttribute('role', 'tooltip'); // Refactor
    composerSubject = Selector(clientName + '_composer_subject');
    dragZoneFileAttachementSelector = Selector(clientName + '_centered_outer');
    dialogSelector = Selector('div').withAttribute('role', 'dialog'); // Refactor
    dragDropInlineImageArea = this.richtextareaContainer.withText('Drag and drop inline images here'); // Refactor
    dragDropFileArea = this.richtextToolbarContainer.find('div').withText('Drag and drop attachments here'); // Refactor
    ccBccButton = this.composerField.find('button').withText('CC/BCC'); // Refactor
    ccBccHideButton = this.composerField.find('button').withText('Hide CC/BCC');
    iframeEl = this.richtextarea.find('iframe'); // Refactor
    iframeAttachedImageElements = this.richtextarea.find('img'); // Refactor
    buttonClearSearch = this.menuSearchSelector.find('button').withAttribute('aria-label', 'Clear Search');  // Refactor
    richtextareaTextContentSelector = this.richtextarea.find('rich-text-area').withAttribute('contenteditable', 'true'); // Refactor
    addressFieldSelector = Selector(clientName + '_address-field_addressField');
    attachmentNameSelector = Selector(clientName + '_attachment_name');
    areaToolbarWrapperSelector = Selector(clientName + '_gui-rich-text-area_toolbarWrapper');

    //Contacts Elements
    toolbarActionItemlistCheckIcon = '.zimbra-icon-check';
    sidebarItemContacts = this.sidebarContentSelector.find('a').withAttribute('title', 'Contacts'); // Refactor
    contactListInner = Selector(clientName + '_smart-list_inner');
    checkboxList = this.contactListInner.find('input').withAttribute('type', 'checkbox'); // Refactor
    contactsReadPane = Selector(clientName + '_contacts_readPane');
    toolBarReadPane = this.contactsReadPane.find(clientName + '_contacts_toolbar'); // Refactor
    contactsFooter = Selector(clientName + '_contacts_footer');
    saveButton = this.contactsFooter.child('button').withText('Save'); // Refactor
    cancelButton = this.contactsFooter.child('button').withText('Cancel'); // Refactor
    contactListToolBar = Selector(clientName + '_contacts_toolbar');
    toolbarActionsButton = Selector(clientName + '_contacts_toggle');//this.contactListToolBar.find('button').withText('Actions'); // Refactor
    toolbarCheckboxButton = this.contactListToolBar.find('input').withAttribute('type', 'checkbox'); // Refactor
    actionItemsListToolbar = Selector(clientName + '_contacts_dropdown').find('a'); // Refactor
    chooseContact = Selector(clientName + '_contacts_selectedContacts');
    newContactButton = Selector(clientName + '_contacts_sidebarHeader').find('a'); // Refactor
    contactsHeader = Selector(clientName + '_contacts_header');
    contactCard = Selector(clientName + '_contacts_card');
    popupEditListsDialog = Selector('.blocks_dialog').withAttribute('role', 'dialog'); // Refactor
    contactListItemWithName = this.contactListInner.find('h4'); // Refactor
    addContactInfoItem = Selector((id) => document.getElementById('contact-x-' + id));


    //Notes Elements
    markupPopoverSelector = Selector('.markup');
    noteWrapperSelector = Selector(notepadName + '_notepad_noteWrapper');
    notepadFooterSelector = Selector(notepadName + '_notepad_footer');
    noteBodySelector = Selector(notepadName + '_notepad_noteBody');
    noteSubjectSelector = this.noteWrapperSelector.find('input').withAttribute('placeholder', 'Note Subject'); // Refactor
    saveButtonSelector = this.notepadFooterSelector.find('button').withText('Save'); // Refactor
    cancelButtonSelector = this.notepadFooterSelector.find('button').withText('Cancel'); // Refactor
    listInnerSelector = Selector(clientName + '_smart-list_inner');
    noteCardDraggableSelector = this.listInnerSelector.find('a').withAttribute('draggable', 'true'); // Refactor
    noteCardTitleSelector = this.noteCardDraggableSelector.find('h5'); // Refactor
    noteCardContectSelector = this.noteCardDraggableSelector.find('h6'); // Refactor
    noteBodyTextareaSelector = this.noteBodySelector.find('textarea'); // Refactor
    listToolbarSelector = Selector(notepadName + '_notepad_listToolbar');
    paneToolbarSelector = Selector(notepadName + '_notepad_paneToolbar');
    paneToolBarMoveButton = this.paneToolbarSelector.find('button').withText('Move '); // Refactor
    paneToolBarTrashButton = this.paneToolbarSelector.find('button').withText('Trash'); // Refactor
    blocksPopoverActiveSelector = Selector('.blocks_popover_active');
    noItemsSelector = Selector(clientName + '_smart-list_noItems').withText('Nothing to show.'); // Refactor
    undoButtonSelector = Selector(clientName + '_notifications_undoButton');
    noteCardDraggableSelectorByTitle = byTitle => this.noteCardTitleSelector.withText(byTitle).parent('a').withAttribute('draggable', 'true') // Refactor
    noteCardDraggableDeleteButtonSelectorByTitle = byTitle => this.noteCardDraggableSelectorByTitle(byTitle).sibling('button') // Refactor
    sidebarContactItemWithTextSelector = withText => elements.sidebarContentSelector.find('a').withText(withText) // Refactor


    // Calendar Elements
    calendarActionButtonSelector = Selector(clientName + '_calendar_toolbar_toolbarTop');
    calendarSidebarPrimaryButtonSelector = Selector(clientName + '_sidebar-primary-button_button');
    calendarModalDialogTextInputSelector = Selector('input');
    calendarListGroupNameSelector = Selector(clientName + '_calendar_calendar-list_groupName');
    calendarMenuItemSelector = Selector(clientName + '_menu-item_inner');

    // Search Elements
    searchInputSelector = Selector(clientName + '_search-input_form');
    searchToolbarSelector = Selector(clientName + '_search-toolbar_toolbar');
    searchMailButtonSelector = Selector(clientName + '_search-header_searchMail');

    // Settings Elements
    iconCogSelector = Selector('.zimbra-icon-cog');
    settingsSidebarItemSelector = Selector(clientName + '_settings_sidebarItem');
    subsectionBodyButtonSelector = Selector(clientName + '_settings_subsectionBodyButton');
    settingsFilterSubsectionTitleSelector = Selector(clientName + '_settings_filters-settings_filter-modal_subsectionTitle');
    settingsFiltersList  = Selector(clientName + '_settings_filtersList');
    blocksButtonSelector = Selector('.blocks_button_regular');
    settingsModalDialogFooterButtonSelector = Selector(clientName + '_inline-modal-dialog_footer');
    checkBoxSelector = Selector('input[type=checkbox]');
    labelSelector = Selector('label');
    settingsSendMeCopyButtonSelector = Selector('#settings.vacationResponse.sendMeCopy');
    settingsVacationResponseTextAreaSelector = Selector(clientName + '_settings_vacationResponseTextArea');

    toastMessageSelector = Selector(clientName + '_notifications');                    // Toast Message


    // Mobile/Tablet Elements
    toolBarActionButton = clientName + '_mail-toolbar_actionButton';
    toolbarComposeButton = clientName + '_mail-toolbar_composeButton';
    toolbarSendButton = clientName + '_composer-toolbar_sendButton';
    toolbarArrowBackIcon = clientName + '_mail-toolbar_arrowBackIcon';

}

export let elements = new Elements();
