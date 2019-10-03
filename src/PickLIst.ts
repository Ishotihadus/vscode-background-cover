import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { FileDom } from './FileDom';
import { ImgItem } from './ImgItem';
import vsHelp from './vsHelp';


export class PickList {
	public static itemList: PickList | undefined;

	// 下拉列表
	private readonly quickPick: vscode.QuickPick<ImgItem> | any;

	private _disposables: vscode.Disposable[] = [];

	// 当前配置
	private config: vscode.WorkspaceConfiguration;

	// 当前配置的背景图路径
	private imgPath: string;

	// 当前配置的背景图透明度
	private opacity: number;

	// 初始下拉列表
	public static createItemLIst() {
		let config: vscode.WorkspaceConfiguration =
			vscode.workspace.getConfiguration('backgroundCover');
		let list: vscode.QuickPick<ImgItem> =
			vscode.window.createQuickPick<ImgItem>();
		list.placeholder = 'Please choose configuration';
		let items: ImgItem[] = [
			{
				label: '$(file-media) Select file',
				description: 'Choose a background image file',
				imageType: 1
			},
			{
				label: '$(file-directory) Select directory',
				description: 'Choose an image directory',
				imageType: 2
			},
			{
				label: '$(pencil) Select path',
				description: 'Input an image path directly',
				imageType: 6
			},
			{
				label: '$(settings) Update opacity',
				description: 'Update the opacity of the background image',
				imageType: 5
			},
			{
				label: '$(eye-closed) Disable',
				description: 'Disable background image',
				imageType: 7
			},
		];
		if (config.autoStatus) {
			items.push({
				label: '$(sync) Disable automatic replacement',
				description: 'Disable automatic replacement on opening window',
				imageType: 10
			})
		} else {
			items.push({
				label: '$(sync) Enable automatic replacement',
				description: 'Enable automatic replacement on opening window',
				imageType: 11
			})
		}
		list.items = items;
		PickList.itemList = new PickList(config, list);
	}

	/**
	 *  自动更新背景
	 */
	public static autoUpdateBackground() {
		let config = vscode.workspace.getConfiguration('backgroundCover');
		if (!config.randomImageFolder || !config.autoStatus) {
			return false;
		}
		PickList.itemList = new PickList(config);
		PickList.itemList.autoUpdateBackground();
		return PickList.itemList = undefined;
	}

	/**
	 *  随机更新一张背景
	 */
	public static randomUpdateBackground() {
		let config = vscode.workspace.getConfiguration('backgroundCover');
		PickList.itemList = new PickList(config);
		PickList.itemList.autoUpdateBackground();
		PickList.itemList.updateDom();
		PickList.itemList = undefined;
		return vscode.commands.executeCommand('workbench.action.reloadWindow');
	}

	// 列表构造方法
	private constructor(
		config: vscode.WorkspaceConfiguration,
		pickList?: vscode.QuickPick<ImgItem>) {
		this.config = config;
		this.imgPath = config.imagePath;
		this.opacity = config.opacity;
		if (pickList) {
			this.quickPick = pickList;
			this.quickPick.onDidAccept(
				(e: any) => this.listChange(
					this.quickPick.selectedItems[0].imageType,
					this.quickPick.selectedItems[0].path));
			this.quickPick.onDidHide(() => {
				this.dispose();
			}, null, this._disposables);
			this.quickPick.show();
		}
	}

	// 列表点击事件分配
	private listChange(type: number, path?: string) {
		switch (type) {
			case 1:
				this.imgList();  // 展示图片列表
				break;
			case 2:
				this.openFieldDialog(2);  // 弹出选择文件夹对话框
				break;
			case 3:
				this.openFieldDialog(1);  // 弹出选择图片文件对话框
				break;
			case 4:
				this.updateBackgound(path);  // 选择列表内图片，更新背景css
				break;
			case 5:
				this.showInputBox(2);  // 更改透明度
				break;
			case 6:
				this.showInputBox(1);  // 输入图片路径更新背景
				break;
			case 7:
				this.updateDom(true);  // 关闭背景图片展示
				break;
			case 8:
				vscode.commands.executeCommand(
					'workbench.action.reloadWindow');  // 重新加载窗口，使设置生效
				break;
			case 9:
				this.quickPick.hide();  // 隐藏设置弹窗
				break;
			case 10:
				this.setConfigValue('autoStatus', false, false);
				this.quickPick.hide();
				break;
			case 11:
				if (!this.config.randomImageFolder) {
					vscode.window.showWarningMessage(
						'Please choose a directory before enabling automatic replacement');
				} else {
					this.setConfigValue('autoStatus', true, false);
					this.autoUpdateBackground();
				}
				this.quickPick.hide();
				break;
			default:
				break;
		}
	}

	//释放资源
	private dispose() {
		PickList.itemList = undefined;
		// Clean up our resources
		this.quickPick.hide();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	/**
	 * 启动时自动更新背景
	 */
	private autoUpdateBackground() {
		if (this.checkFolder(this.config.randomImageFolder)) {
			// 获取目录下的所有图片
			let files: string[] =
				this.getFolderImgList(this.config.randomImageFolder);
			// 是否存在图片
			if (files.length > 0) {
				// 获取一个随机路径存入数组中
				let randomFile = files[Math.floor(Math.random() * files.length)];
				let file = path.join(this.config.randomImageFolder, randomFile);
				this.listChange(4, file);
			}
		}
		return true;
	}

	// 根据图片目录展示图片列表
	private imgList(folderPath?: string) {
		let items: ImgItem[] = [{
			label: '$(diff-added) Select image manually',
			description: 'Update the background image to a specified image from the directory',
			imageType: 3
		}];

		let randomPath: any =
			folderPath ? folderPath : this.config.randomImageFolder;
		if (this.checkFolder(randomPath)) {
			// 获取目录下的所有图片
			let files: string[] = this.getFolderImgList(randomPath);
			// 是否存在图片
			if (files.length > 0) {
				// 获取一个随机路径存入数组中
				let randomFile = files[Math.floor(Math.random() * files.length)];
				items.push({
					label: '$(light-bulb) Select image randomly',
					description: 'Update the background image to a randomly selected image (Ctrl+Shift+F7)',
					imageType: 4,
					path: path.join(randomPath, randomFile)
				});
				items = items.concat(files.map(
					(e) => new ImgItem('$(tag) ' + e, e, 4, path.join(randomPath, e))));
			}
		}

		this.quickPick.items = items;
		this.quickPick.show();
	}

	/**
	 * 获取目录下的所有图片
	 * @param pathUrl
	 */
	private getFolderImgList(pathUrl: string): string[] {
		if (!pathUrl || pathUrl === '') {
			return [];
		}
		// 获取目录下的所有图片
		let files: string[] = fs.readdirSync(path.resolve(pathUrl)).filter((s) => {
			return s.endsWith('.png') || s.endsWith('.jpg') || s.endsWith('.jpeg') ||
				s.endsWith('.gif') || s.endsWith('.webp') || s.endsWith('.bmp');
		});

		return files;
	}


	// 检查选择的文件及目录是否正确
	private checkFolder(folderPath: string) {
		if (!folderPath) {
			return false;
		}
		// 判断路径是否存在
		let fsStatus = fs.existsSync(path.resolve(folderPath));
		if (!fsStatus) {
			return false;
		}
		// 判断是否为目录路径
		let stat = fs.statSync(folderPath);
		if (!stat.isDirectory()) {
			return false;
		}

		return true;
	}

	// 创建一个输入框
	private showInputBox(type: number) {
		if (type <= 0 || type > 2) { return false; }

		let placeString = type === 2 ?
			'Opacity: 0 - 1 (current: ' + this.opacity + ')' :
			'Please enter the image path (local or https)';
		let promptString =
			type === 2 ? 'Enter the opacity of the background image from 0 to 1' : 'Enter a local or online path of the image';


		let option: vscode.InputBoxOptions = {
			ignoreFocusOut: true,
			password: false,
			placeHolder: placeString,
			prompt: promptString
		};

		vscode.window.showInputBox(option).then(value => {
			//未输入值返回false
			if (!value) {
				vscode.window.showWarningMessage(
					'Cannot leave the parameter empty');
				return;
			}
			if (type === 1) {
				// 判断路径是否存在
				let fsStatus = fs.existsSync(path.resolve(value));
				let isUrl = (value.substr(0, 8).toLowerCase() === 'https://');
				if (!fsStatus && !isUrl) {
					vscode.window.showWarningMessage(
						'Invalid image path (file not found or invalid url)');
					return false;
				}
			} else {
				let isOpacity = parseFloat(value);

				if (isOpacity < 0 || isOpacity > 1 || isNaN(isOpacity)) {
					vscode.window.showWarningMessage('Opacity must be between 0 and 1');
					return false;
				}
			}

			this.setConfigValue(
				(type === 1 ? 'imagePath' : 'opacity'),
				(type === 1 ? value : parseFloat(value)), true);
		})
	}

	// 更新配置
	private updateBackgound(path?: string) {
		if (!path) {
			return vsHelp.showInfo('Image path is not specified');
		}
		this.setConfigValue('imagePath', path);
	}

	// 文件、目录选择
	private async openFieldDialog(type: number) {
		let isFolders = type === 1 ? false : true;
		let isFiles = type === 2 ? false : true;
		let filters =
			type === 1 ? { 'Images': ['png', 'jpg', 'gif', 'jpeg'] } : undefined;
		let folderUris = await vscode.window.showOpenDialog({
			canSelectFolders: isFolders,
			canSelectFiles: isFiles,
			canSelectMany: false,
			openLabel: 'Select directory',
			filters: filters
		});
		if (!folderUris) {
			return false;
		}
		let fileUri = folderUris[0];
		if (type === 2) {
			this.setConfigValue('randomImageFolder', fileUri.fsPath, false);
			return this.imgList(fileUri.fsPath);
		}
		if (type === 1) {
			return this.setConfigValue('imagePath', fileUri.fsPath);
		}

		return false;
	}

	// 更新配置
	private setConfigValue(name: string, value: any, updateDom: Boolean = true) {
		// 更新变量
		this.config.update(name, value, vscode.ConfigurationTarget.Global);
		switch (name) {
			case 'opacity':
				this.opacity = value;
				break;
			case 'imagePath':
				this.imgPath = value;
				break;
			default:
				break;
		}
		// 是否需要更新Dom
		if (updateDom) {
			this.updateDom();
		}
		return true;
	}


	// 更新、卸载css
	private updateDom(uninstall: boolean = false) {
		let dom: FileDom = new FileDom(this.imgPath, this.opacity, this.config.customCss);
		let result = false;
		if (uninstall) {
			result = dom.uninstall();
		} else {
			result = dom.install();
		}
		if (result && this.quickPick) {
			this.quickPick.placeholder = 'Reload to take effect the configuration now?';
			this.quickPick.items = [
				{
					label: '$(check) YES',
					description: 'Reload now',
					imageType: 8
				},
				{ label: '$(x) NO', description: 'Manually reload later', imageType: 9 }
			];
			this.quickPick.ignoreFocusOut = true;
			this.quickPick.show();
		}
	}
}