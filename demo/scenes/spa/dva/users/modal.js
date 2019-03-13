import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Modal from 'antd/lib/modal';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';

const FormItem = Form.Item;

class UserEditModal extends Component {
  static propTypes = {
    onOk: PropTypes.fun,
    form: PropTypes.object,
    record: PropTypes.object,
    children: PropTypes.node
  }
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  showModelHandler = e => {
    if (e) e.stopPropagation();
    this.setState({
      visible: true,
    });
  };

  hideModelHandler = () => {
    this.setState({
      visible: false,
    });
  };

  okHandler = () => {
    const {onOk} = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        onOk(values);
        this.hideModelHandler();
      }
    });
  };

  render() {
    const {children} = this.props;
    const {getFieldDecorator} = this.props.form;
    const {name, email, website} = this.props.record;
    const formItemLayout = {
      labelCol: {span: 6},
      wrapperCol: {span: 14},
    };

    return (
      <span>
        <span onClick={this.showModelHandler}>{children}</span>
        <Modal
          title="Edit User"
          visible={this.state.visible}
          onOk={this.okHandler}
          onCancel={this.hideModelHandler}
        >
          <Form layout="horizontal" onSubmit={this.okHandler}>
            <FormItem {...formItemLayout} label="Name">
              {getFieldDecorator('name', {
                initialValue: name,
              })(<Input />)}
            </FormItem>
            <FormItem {...formItemLayout} label="Email">
              {getFieldDecorator('email', {
                initialValue: email,
              })(<Input />)}
            </FormItem>
            <FormItem {...formItemLayout} label="Website">
              {getFieldDecorator('website', {
                initialValue: website,
              })(<Input />)}
            </FormItem>
          </Form>
        </Modal>
      </span>
    );
  }
}

export default Form.create()(UserEditModal);
