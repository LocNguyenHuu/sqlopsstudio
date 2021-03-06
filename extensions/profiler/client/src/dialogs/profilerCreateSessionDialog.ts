/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as nls from 'vscode-nls';
import * as sqlops from 'sqlops';
import * as vscode from 'vscode';
import { CreateSessionData } from '../data/createSessionData';

const localize = nls.loadMessageBundle();

export class CreateSessionDialog {

	// Top level
	private readonly DialogTitle: string = localize('createSessionDialog.newSession', 'New Session');
	private readonly CancelButtonText: string = localize('createSessionDialog.cancel', 'Cancel');
	private readonly CreateButtonText: string = localize('createSessionDialog.create', 'Create');
	private readonly DialogTitleText: string = localize('createSessionDialog.title', 'Create New Profiler Session');

	// UI Components
	private dialog: sqlops.window.modelviewdialog.Dialog;
	private templatesBox: sqlops.DropDownComponent;
	private sessionNameBox: sqlops.InputBoxComponent;

	private model: CreateSessionData;

	private _onSuccess: vscode.EventEmitter<CreateSessionData> = new vscode.EventEmitter<CreateSessionData>();
	public readonly onSuccess: vscode.Event<CreateSessionData> = this._onSuccess.event;


	constructor(ownerUri: string, templates: Array<sqlops.ProfilerSessionTemplate>) {
		if (typeof (templates) === 'undefined' || templates === null) {
			throw new Error(localize('createSessionDialog.templatesInvalid', "Invalid templates list, cannot open dialog"));
		}
		if (typeof (ownerUri) === 'undefined' || ownerUri === null) {
			throw new Error(localize('createSessionDialog.dialogOwnerInvalid', "Invalid dialog owner, cannot open dialog"));
		}
		this.model = new CreateSessionData(ownerUri, templates);
	}

	public async showDialog(): Promise<void> {
		this.dialog = sqlops.window.modelviewdialog.createDialog(this.DialogTitle);
		this.initializeContent();
		this.dialog.okButton.onClick(() => this.execute());
		this.dialog.cancelButton.onClick(() => { });
		this.dialog.okButton.label = this.CreateButtonText;
		this.dialog.cancelButton.label = this.CancelButtonText;

		sqlops.window.modelviewdialog.openDialog(this.dialog);
	}

	private initializeContent(): void {
		this.dialog.registerContent(async view => {
			this.templatesBox = view.modelBuilder.dropDown()
				.withProperties({
					values: []
				}).component();

			this.sessionNameBox = view.modelBuilder.inputBox()
				.withProperties({
					required: true,
					multiline: false,
					value: ''
				}).component();

			let formModel = view.modelBuilder.formContainer()
				.withFormItems([{
					components: [{
						component: this.templatesBox,
						title: localize('createSessionDialog.selectTemplates', "Select session template:")
					},
					{
						component: this.sessionNameBox,

						title: localize('createSessionDialog.enterSessionName', "Enter session name:")
					}],
					title: this.DialogTitleText
				}]).withLayout({ width: '100%' }).component();

			await view.initializeModel(formModel);

			if (this.model.templates) {
				this.templatesBox.values = this.model.getTemplateNames();
			}

			this.sessionNameBox.onTextChanged(() => {
				if (this.sessionNameBox.value.length > 0) {
					this.model.sessionName = this.sessionNameBox.value;
					this.dialog.okButton.enabled = true;
				} else {
					this.dialog.okButton.enabled = false;
				}
			});
		});
	}

	private async execute(): Promise<void> {
		let currentConnection = await sqlops.connection.getCurrentConnection();
		let profilerService = sqlops.dataprotocol.getProvider<sqlops.ProfilerProvider>(currentConnection.providerName, sqlops.DataProviderType.ProfilerProvider);

		let name = this.sessionNameBox.value;
		let selected = this.templatesBox.value.toString();
		let temp = this.model.selectTemplate(selected);
		profilerService.createSession(this.model.ownerUri, this.sessionNameBox.value, temp);
	}
}