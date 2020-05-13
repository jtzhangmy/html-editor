import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Dialog } from '../../component';
import { Element, SideBar } from './components';
import utils from '../../common/utils';
import uploadFile from '../../common/upload';
import query from 'query-string';
import html2canvas from 'html2canvas';
import './editor.scss';
import {
    pageInit,
    indexIncrement,
    pidSet,
    canvasPositionSet,
    elementSelect,
    elementsUpdate,
    htmlSave,
    htmlBuild,
    htmlOpen,
    htmlRelease,
    indexSet,
    titleSet,
    descSet,
    activeIdSet,
    isEditSet,
    listPreviewSave,
    htmlDelete, dialogHandle,
} from './actions';

// 模板列表
const componentList = [
    {
        label: '视图容器',
        list: [
            {
                title: '容器 □',
                component: 'View',
            },
            {
                title: '滚动容器 □',
                component: 'ScrollView',
            },
            {
                title: '滑动框',
                component: 'Swiper',
            },
        ],
    },
    {
        label: '基础内容',
        list: [
            {
                title: '跳转 □',
                component: 'Link',
            },
            {
                title: '文字',
                component: 'Text',
            },
            {
                title: '图标',
                component: 'Icon',
            },
        ],
    },
    {
        label: '表单组件',
        list: [
            {
                title: '表单 □',
                component: 'Form',
            },
            {
                title: '单行文本框',
                component: 'Input',
            },
            {
                title: '多行文本框',
                component: 'Textarea',
            },
            {
                title: '单项选择',
                component: 'Radio',
            },
            {
                title: '多项选择',
                component: 'Checkbox',
            },
            {
                title: '下拉框',
                component: 'Select',
            },
            {
                title: '文件上传 □',
                component: 'Upload',
            },
            {
                title: '提交',
                component: 'Submit',
            },
        ],
    },
    {
        label: '媒体组件',
        list: [
            {
                title: '图片',
                component: 'Image',
            },
            {
                title: '视频',
                component: 'Video',
            },
            {
                title: '音频',
                component: 'Audio',
            },
        ],
    },
    {
        label: '其他',
        list: [
            {
                title: '弹窗 □',
                component: 'Dialog',
            },
        ],
    },
];

// 可嵌套组件
const containerElement = ['Root', 'View', 'ScrollView', 'Form', 'Upload', 'Link', 'Dialog'];

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pid: '',
            isDown: false,
            dragName: '',
            // 移动中位置
            movingX: 0,
            movingY: 0,

            deleteShow: false,
            deletePid: '',
        };
    }

    componentDidMount() {
        setTimeout(() => this.ctxPosition(), 500);
        this.init();

        // 禁止右击菜单
        document.oncontextmenu = () => false;

        //禁止鼠标选中文本
        document.onselectstart = () => false;

        // ^^^^^^ 鼠标右击
        /*document.onmousedown = e => {
            const event = e || window.event;
            if (event.button == '2') {
                console.error(111, e)
            }
        };*/
    }

    // 初始化
    init() {
        const { pid } = query.parse(this.props.location.search);
        this.setState({ pid });
        pageInit({ pid })
            .then(res => {
                const { pid, index, title, desc, htmlTree } = res;
                this.props.dispatch(pidSet(pid));
                index && this.props.dispatch(indexSet(index));
                htmlTree && this.props.dispatch(elementsUpdate(htmlTree));
                title && this.props.dispatch(titleSet(title));
                desc && this.props.dispatch(descSet(desc));
                // 设置参数但不跳转
                window.history.pushState(null, null, `${location.origin}/editor?pid=${pid}`);
            })
            .catch(err => {
                console.error(err);
            });
    }

    // 控制标题
    async handleTitle(status) {
        const { title } = this.props.editorInfo;
        await this.setState({ titleEdit: status });
        if (status) {
            if (title == '未命名页面') this.props.dispatch(titleSet(''));
        } else {
            if (!title) this.props.dispatch(titleSet('未命名页面'));
        }
    }

    // 标题更改
    titleChange(e) {
        const title = e.target.value;
        this.props.dispatch(titleSet(title));
    }

    // 标题更改
    descChange(e) {
        const desc = e.target.value;
        this.props.dispatch(descSet(desc));
    }

    // 设置唯一key
    uniqueKey(num) {
        const letter = 'ABCDEFGHIJ';
        const str = num.toString();
        return str
            .split('')
            .map(item => letter[parseInt(item)])
            .join('-');
    }

    // 获取画布位置
    ctxPosition() {
        const { offsetTop, offsetHeight, offsetLeft, offsetWidth } = this.refs.ctx || {};
        const canvasPosition = {
            ctxTop: offsetTop,
            ctxBottom: offsetTop + offsetHeight,
            ctxLeft: offsetLeft,
            ctxRight: offsetLeft + offsetWidth,
            ctxHeight: offsetHeight,
            ctxWidth: offsetWidth,
        };
        this.props.dispatch(canvasPositionSet(canvasPosition));
    }

    // 开始拖拽
    msDown(ele, evt) {
        this.setState({
            isDown: true,
            dragName: ele,
            movingX: evt.clientX,
            movingY: evt.clientY,
        });

        // 拖拽中
        window.onmousemove = e => {
            if (!this.state.isDown) return;
            //获取x和y
            this.setState({
                movingX: e.clientX,
                movingY: e.clientY,
            });
        };
        // 拖拽结束
        window.onmouseup = e => {
            const { isDown } = this.state;
            const {
                canvasPosition: { ctxTop, ctxBottom, ctxLeft, ctxRight },
            } = this.props.editorInfo;
            if (!isDown) return;
            this.setState({ isDown: false, movingX: 0, movingY: 0 });
            const endX = e.clientX;
            const endY = e.clientY;
            // 判断是否在画布内
            if (endX > ctxLeft && endX < ctxRight && endY > ctxTop && endY < ctxBottom) {
                this.setSucc(ele);
            } else {
                this.setFail();
            }
        };
    }

    // 设置元素成功
    setSucc(element) {
        const { elements, index, activeId, activeEle } = this.props.editorInfo;
        const id = this.uniqueKey(index);
        let newElements;
        const defaultEle = {
            element,
            id,
            text: '',
            onClick: this.onNodeSelect.bind(this, id),
            ...utils.defaultJs(element, id, { formId: activeId }), // 组件自带的js
        };
        if (element === 'Dialog') {
            // dialog 放到最外层 并默认展示
            newElements = { ...elements, ...{ [id]: defaultEle } };
            this.props.dispatch(dialogHandle(id, true));
        } else if (activeId) {
            console.error(containerElement, activeEle.element)
            // 嵌套
            if (utils.has(containerElement, activeEle.element)) {
                newElements = utils.deepInsert(elements, activeId, { [id]: defaultEle });
            } else {
                utils.toast('只有容器元素可以容纳其他元素');
                return;
            }
        } else {
            // 普通插入
            newElements = utils.deepInsert(elements, 'root', { [id]: defaultEle });
        }
        this.props.dispatch(indexIncrement()); // 索引自增
        this.props.dispatch(elementsUpdate(newElements)); // 元素更新
        this.props.dispatch(elementSelect(id, activeId, this.props.editorInfo.elements)); // 选中元素 后面element得取更新过后的
        console.error('set success!!!');
    }

    // 设置元素失败
    setFail() {
        console.error('fail');
    }

    // 选中元素 ^^^^^^
    onNodeSelect(id) {
        const { activeId, elements } = this.props.editorInfo;
        this.props.dispatch(elementSelect(id, activeId, elements));
    }

    // 取消选中
    unSelect(e) {
        e.stopPropagation();
        this.props.dispatch(activeIdSet(false));
        this.props.dispatch(isEditSet(false));
    }

    // 渲染画布中元素
    renderElements(elements) {
        const { activeId } = this.props.editorInfo;
        const list = Object.values(elements);
        return list.map((item, idx) => {
            return (
                <Element key={`item-${idx}`} item={item} active={activeId == item.id}>
                    {item.children && this.renderElements(item.children)}
                </Element>
            );
        });
    }

    // 保存
    async save() {
        const { elements, pid, index, title, desc } = this.props.editorInfo;
        let preview = '';
        // 生成截图
        await html2canvas(document.getElementById('root')).then(async canvas => {
            const base64Data = canvas.toDataURL('image/png');
            const blob = utils.dataURItoBlob(base64Data);
            const formData = new FormData();
            formData.append('file', blob);
            formData.append('pid', pid);
            // 保存截图
            preview = await listPreviewSave(formData);
        });
        htmlSave({
            pid,
            index,
            title,
            desc,
            htmlTree: elements,
            preview,
        })
            .then(res => {
                utils.toast(res.result ? '保存成功' : '保存失败');
            })
            .catch(err => {
                utils.toast(['保存失败', err.msg]);
            });
    }

    // 构建
    build() {
        const { pid } = this.props.editorInfo;
        htmlBuild({ pid })
            .then(res => {
                utils.toast(res.result ? '生成成功' : '生成失败');
            })
            .catch(err => {
                utils.toast('生成失败');
            });
    }

    // 打开
    open() {
        const { pid } = this.props.editorInfo;
        htmlOpen({ pid })
            .then(res => {
                window.open(res.url);
            })
            .catch(err => {
                utils.toast('无法打开');
                console.error(err);
            });
    }

    // 发布
    release() {
        const { pid } = this.props.editorInfo;
        htmlRelease({ pid })
            .then(res => {
                utils.toast('发布成功');
            })
            .catch(err => {
                utils.toast('发布失败');
                console.error(err);
            });
    }

    // 删除弹窗控制
    deleteDialogHandle(deleteShow) {
        this.setState({ deleteShow });
    }

    delInputChange(e) {
        const deletePid = e.target.value;
        this.setState({ deletePid });
    }

    // 确认删除
    delConfirm() {
        const { pid } = this.props.editorInfo;
        const { deletePid } = this.state;
        if (deletePid === pid) {
            htmlDelete({ pid }).then(res => {
                if (res.result === true) {
                    utils.toast('删除成功');
                    setTimeout(() => window.close(), 3000);
                }
            });
            this.deleteDialogHandle(false);
        } else {
            utils.toast('请输入正确的pid');
        }
    }

    // 复制pid
    copyPid() {
        const { pid } = this.props.editorInfo;
        utils.copy(pid);
    }


    render() {
        const {
            editorInfo: { pid, title, desc, elements, activeEle, activeId },
        } = this.props;
        const { isDown, dragName, movingX, movingY, deleteShow, deletePid } = this.state;

        return (
            <div className='editor'>
                <div className='header'>
                    {/*------ 标题 ------*/}
                    <div className='title-info'>
                        <input
                            type='text'
                            className='title-input'
                            value={title}
                            onChange={this.titleChange.bind(this)}
                            onFocus={this.handleTitle.bind(this, true)}
                            onBlur={this.handleTitle.bind(this, false)}
                        />
                        <input
                            type='text'
                            className='desc-input'
                            value={desc}
                            placeholder='请输入简介'
                            onChange={this.descChange.bind(this)}
                        />
                    </div>
                    {/*------ 按钮组 ------*/}
                    <div className='btn-box'>
                        <div className='button primary' onClick={this.save.bind(this)}>
                            保存
                        </div>
                        <div className='button warrning' onClick={this.build.bind(this)}>
                            生成
                        </div>
                        <div className='button success' onClick={this.open.bind(this)}>
                            打开
                        </div>
                        <div className='button info' onClick={this.release.bind(this)}>
                            发布
                        </div>
                        <div className='button danger' onClick={this.deleteDialogHandle.bind(this, true)}>
                            删除
                        </div>
                    </div>
                </div>
                <div className='content'>
                    {/*------ 元素列表 ------*/}
                    <div className='ele-list'>
                        {componentList.map((item, idx) => (
                            <div key={`item-${idx}`} className='list-card'>
                                <div className='list-label'>{item.label}</div>
                                {item.list.map((row, i) => (
                                    <div
                                        key={`row-${i}`}
                                        className='ele-item'
                                        title={row.title}
                                        onMouseDown={this.msDown.bind(this, row.component)}
                                    >
                                        {row.component} {row.title}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    {/*------ 画布 ------*/}
                    <div className='table' onClick={this.unSelect.bind(this)}>
                        <div id='context' className='context' ref='ctx'>
                            {this.renderElements(elements)}
                        </div>
                    </div>
                    {/*------ 属性 ------*/}
                    <div className='side-bar'>
                        <SideBar />
                    </div>
                </div>
                {/*------ 拖拽虚拟元素 ------*/}
                <div
                    className={classNames('shadow-ele', { show: isDown })}
                    style={{ left: `${movingX}px`, top: `${movingY}px` }}
                >
                    {dragName}
                </div>
                {/*------ 删除弹窗 ------*/}
                <Dialog
                    title='删除确认'
                    show={deleteShow}
                    renderFooter={
                        <div className='footer'>
                            <div className='button cancel' onClick={this.deleteDialogHandle.bind(this, false)}>
                                取消
                            </div>
                            <div className='button confirm' onClick={this.delConfirm.bind(this)}>
                                确认
                            </div>
                        </div>
                    }
                >
                    <p className='delete-key' onClick={this.copyPid.bind(this)}>
                        {pid}
                    </p>
                    <input
                        type='text'
                        className='delete-input'
                        placeholder='请粘贴上面的id入内删除'
                        value={deletePid}
                        onChange={this.delInputChange.bind(this)}
                    />
                </Dialog>
            </div>
        );
    }
}

export default connect(
    ({ editorInfo }) => ({ editorInfo }),
    dispatch => ({ dispatch }),
)(Editor);
