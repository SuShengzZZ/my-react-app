import { Card, NavBar, Steps } from 'antd-mobile';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { ClientType } from '../../common/clientType.ts';

const { Step } = Steps;

export default function Student() {
  const type = ClientType.Student;
  const [searchParams] = useSearchParams(); // 获取问号传递来的参数

  const [roomid, setRoomid] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // const [socketState, setSocketState] = useState<Socket | null>(null);

  useEffect(() => {
    if (!roomid) {
      return;
    }

    if (isWeChat()) {
      alert('请点击右上角跳转到浏览器');
      return;
    } else if (isAlipay()) {
    } else {
      const currentURL = window.location.href;
      window.location.href = `alipays://platformapi/startapp?appId=10000007&qrcode=${currentURL}`;
      return;
    }

    const socket = io('http://43.143.249.201:3000');
    // setSocketState(socket);

    // 房间连接成功后初始化摄像头
    socket.on('connect', function () {
      console.log('connect');
      socket.emit('joinRoom', { roomid, type });
      setIsConnected(true);
    });

    // 房间连接失败后提示重新刷新
    socket.on('connect_error', function () {
      console.log('connect_error');
      setIsConnected(false);
      alert('房间加入失败，请刷新');
    });

    socket.on('hdlReceiveQrMessage', function (body) {
      window.location.href = `alipay://platformapi/startapp?appId=10000007&qrcode=${body}`;
    });

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomid, type });
        // 关闭socket
        socket.disconnect();
      }
    };
  }, [roomid]);

  const getRoomid = async () => {
    const orderid = searchParams.get('id');
    if (!orderid) {
      return;
    }
    const res: any = await axios.get(
      `http://43.143.249.201:3000/order/id?id=${orderid}`,
    );
    const { roomid } = res.data;
    setRoomid(roomid);
  };

  useEffect(() => {
    getRoomid();
  }, []);

  // 检查是否在微信内
  const isWeChat = () => {
    return /MicroMessenger/i.test(navigator.userAgent);
  };

  // 检查是否在支付宝内
  const isAlipay = () => {
    return /Alipay/i.test(navigator.userAgent);
  };

  return (
    <div>
      <NavBar back={null} style={{ background: '#f5f5f5' }}>
        付款
      </NavBar>
      <Card title="房间信息">
        <div>房间号：{roomid}</div>
        <div>当前状态：{isConnected ? '在线' : '离线'}</div>
        <div>付款人：{isConnected ? '在线' : '离线'}</div>
      </Card>
      <Card title="进度信息">
        <Steps current={2} direction="vertical">
          <Step title="顾客加入房间" description="加入时间：22-12-01 12:30" />
          <Step title="付款人加入房间" />
          <Step title="顾客扫码" />
          <Step title="付款人付款" />
          <Step title="付款完成" />
          <Step title="订单结束" />
        </Steps>
      </Card>
    </div>
  );
}
