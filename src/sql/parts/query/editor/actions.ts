
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Action } from 'vs/base/common/actions';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { ITree } from 'vs/base/parts/tree/browser/tree';

import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { SaveFormat } from 'sql/parts/grid/common/interfaces';
import { Table } from 'sql/base/browser/ui/table/table';
import { GridTableState } from 'sql/parts/query/editor/gridPanel';
import { QueryEditor } from './queryEditor';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';

export interface IGridActionContext {
	cell: { row: number; cell: number; };
	selection: Slick.Range[];
	runner: QueryRunner;
	batchId: number;
	resultId: number;
	table: Table<any>;
	tableState: GridTableState;
}

export interface IMessagesActionContext {
	selection: Selection;
	tree: ITree;
}

export class SaveResultAction extends Action {
	public static SAVECSV_ID = 'grid.saveAsCsv';
	public static SAVECSV_LABEL = localize('saveAsCsv', 'Save As CSV');
	public static SAVECSV_ICON = 'saveCsv';

	public static SAVEJSON_ID = 'grid.saveAsJson';
	public static SAVEJSON_LABEL = localize('saveAsJson', 'Save As JSON');
	public static SAVEJSON_ICON = 'saveJson';

	public static SAVEEXCEL_ID = 'grid.saveAsExcel';
	public static SAVEEXCEL_LABEL = localize('saveAsExcel', 'Save As Excel');
	public static SAVEEXCEL_ICON = 'saveExcel';

	constructor(
		id: string,
		label: string,
		icon: string,
		private format: SaveFormat
	) {
		super(id, label, icon);
	}

	public run(context: IGridActionContext): TPromise<boolean> {
		context.runner.serializeResults(context.batchId, context.resultId, this.format, context.selection);
		return TPromise.as(true);
	}
}

export class CopyResultAction extends Action {
	public static COPY_ID = 'grid.copySelection';
	public static COPY_LABEL = localize('copySelection', 'Copy');

	public static COPYWITHHEADERS_ID = 'grid.copyWithHeaders';
	public static COPYWITHHEADERS_LABEL = localize('copyWithHeaders', 'Copy With Headers');

	constructor(
		id: string,
		label: string,
		private copyHeader: boolean,
	) {
		super(id, label);
	}

	public run(context: IGridActionContext): TPromise<boolean> {
		context.runner.copyResults(context.selection, context.batchId, context.resultId, this.copyHeader);
		return TPromise.as(true);
	}
}

export class SelectAllGridAction extends Action {
	public static ID = 'grid.selectAll';
	public static LABEL = localize('selectAll', 'Select All');

	constructor() {
		super(SelectAllGridAction.ID, SelectAllGridAction.LABEL);
	}

	public run(context: IGridActionContext): TPromise<boolean> {
		context.table.setSelectedRows(true);
		return TPromise.as(true);
	}
}

export class CopyMessagesAction extends Action {
	public static ID = 'grid.messages.copy';
	public static LABEL = localize('copyMessages', 'Copy');

	constructor(
		@IClipboardService private clipboardService: IClipboardService
	) {
		super(CopyMessagesAction.ID, CopyMessagesAction.LABEL);
	}

	public run(context: IMessagesActionContext): TPromise<boolean> {
		this.clipboardService.writeText(context.selection.toString());
		return TPromise.as(true);
	}
}

export class SelectAllMessagesAction extends Action {
	public static ID = 'grid.messages.selectAll';
	public static LABEL = localize('selectAll', 'Select All');

	constructor() {
		super(SelectAllMessagesAction.ID, SelectAllMessagesAction.LABEL);
	}

	public run(context: IMessagesActionContext): TPromise<boolean> {
		let range = document.createRange();
		range.selectNodeContents(context.tree.getHTMLElement());
		let sel = document.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		return TPromise.as(true);
	}
}

export class MaximizeTableAction extends Action {
	public static ID = 'grid.maximize';
	public static LABEL = localize('maximize', 'Maximize');
	public static ICON = 'extendFullScreen';

	constructor() {
		super(MaximizeTableAction.ID, MaximizeTableAction.LABEL, MaximizeTableAction.ICON);
	}

	public run(context: IGridActionContext): TPromise<boolean> {
		context.tableState.maximized = true;
		return TPromise.as(true);
	}
}

export class MinimizeTableAction extends Action {
	public static ID = 'grid.minimize';
	public static LABEL = localize('minimize', 'Minimize');
	public static ICON = 'exitFullScreen';

	constructor() {
		super(MinimizeTableAction.ID, MinimizeTableAction.LABEL, MinimizeTableAction.ICON);
	}

	public run(context: IGridActionContext): TPromise<boolean> {
		context.tableState.maximized = false;
		return TPromise.as(true);
	}
}

export class ChartDataAction extends Action {
	public static ID = 'grid.chart';
	public static LABEL = localize('chart', 'Chart');
	public static ICON = 'viewChart';

	constructor(@IEditorService private editorService: IEditorService) {
		super(ChartDataAction.ID, ChartDataAction.LABEL, ChartDataAction.ICON);
	}

	public run(context: IGridActionContext): TPromise<boolean> {
		let activeEditor = this.editorService.activeEditor;
		if (activeEditor instanceof QueryEditor) {
			activeEditor.resultsEditor.chart({ batchId: context.batchId, resultId: context.resultId });
			return TPromise.as(true);
		} else {
			return TPromise.as(false);
		}
	}
}

export class ShowQueryPlanAction extends Action {
	public static ID = 'showQueryPlan';
	public static LABEL = localize('showQueryPlan', 'Show Query Plan');

	constructor(
		@IEditorService private editorService: IEditorService
	) {
		super(ShowQueryPlanAction.ID, ShowQueryPlanAction.LABEL);
	}

	public run(xml: string): TPromise<boolean> {
		let activeEditor = this.editorService.activeControl;
		if (activeEditor instanceof QueryEditor) {
			activeEditor.resultsEditor.showQueryPlan(xml);
			return TPromise.as(true);
		} else {
			return TPromise.as(false);
		}
	}

}
