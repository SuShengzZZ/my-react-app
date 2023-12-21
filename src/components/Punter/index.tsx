import { Card, NavBar, Steps } from 'antd-mobile';
import axios from 'axios';
import jsQR from 'jsqr';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { MessageType } from '../../types/message.js';

const { Step } = Steps;

export default function Punter() {
  const constraints = { video: { facingMode: 'environment' } }; // 使用后置摄像头

  const [searchParams] = useSearchParams(); // 获取问号传递来的参数
  const [roomid, setRoomid] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [socketState, setSocketStats] = useState<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initializeCamera = async () => {
    console.log('initializeCamera');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // 获取用户媒体设备
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // 将流设置为 video 元素的源
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error.message);
    }
  };

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

  useEffect(() => {
    let currentCode = '';
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !roomid) {
      return;
    }

    const socket = io('http://43.143.249.201:3000');
    setSocketStats(socket);

    const sendCode = (code: string) => {
      if (currentCode === code) {
        return;
      }
      if (socketState !== null && isConnected) {
        currentCode = code;
        if (code && code.includes('kiwa-tech')) {
          console.log('code', code);
          const message: MessageType = {
            roomid: roomid || '',
            type: 1,
            message: code,
          };
          socket?.emit('hdlSendQrMessage', message);
        }
      }
    };

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');

      const width = video.clientWidth || 400;
      const height = video.clientHeight || 300;

      const drawFrame = () => {
        // 将视频帧绘制到canvas上
        ctx?.drawImage(video, 0, 0, width, height);

        // 使用 jsQR 库来扫描二维码
        const imageData = ctx?.getImageData(0, 0, width, height);
        if (imageData) {
          const code = (jsQR as any)(imageData.data, width, height);
          if (code) {
            sendCode(code.data);
            // 在这里处理获取到的二维码信息
            // console.log('QR Code detected:', code.data);
          }
        }

        // 递归调用，实现持续绘制
        requestAnimationFrame(drawFrame);
      };

      // 开始绘制
      drawFrame();
    };

    video.onloadedmetadata = () => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      scan();
    };

    if (!roomid) {
      return;
    }
    // 房间连接成功后初始化摄像头
    socket.on('connect', function () {
      console.log('connect');
      socket.emit('joinRoom', {
        roomid,
        type: 1,
      });

      setIsConnected(true);
      initializeCamera(); // 初始化摄像头
    });

    // 房间连接失败后提示重新刷新
    socket.on('connect_error', function () {
      console.log('connect_error');
      setIsConnected(false);
      alert('房间加入失败，请刷新');
    });

    return () => {
      // 在组件卸载时关闭摄像头
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }
      socket.emit('leaveRoom', {
        roomid,
        type: 1,
      });
      // 关闭socket
      socket.disconnect();
    };
  }, [roomid]);

  return (
    <div>
      <NavBar back={null} style={{ background: '#f5f5f5' }}>
        顾客扫码
      </NavBar>
      <video
        ref={videoRef}
        width="100%"
        height="500"
        playsInline
        muted
        autoPlay
      ></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <Card title="房间信息">
        <div>房间号：{roomid}</div>
        <div>当前状态：{isConnected ? '在线' : '离线'}</div>
        <h2>【请将摄像头对准二维码，等待付款完成】</h2>
        {/* <div>付款人：{isConnected ? '在线' : '离线'}</div> */}
      </Card>
      {/* <Card title='进度信息'>
        <Steps current={2} direction='vertical'>
          <Step title='顾客加入房间' description='加入时间：22-12-01 12:30' />
          <Step title='付款人加入房间' />
          <Step title='顾客扫码' />
          <Step title='付款人付款' />
          <Step title='付款完成' />
          <Step title='订单结束' />
        </Steps>
      </Card> */}
    </div>
  );
}
