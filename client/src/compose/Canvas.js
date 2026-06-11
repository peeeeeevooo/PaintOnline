import React, {useEffect, useRef, useState} from 'react';
import "../styles/canvas.scss"
import {observer} from "mobx-react-lite";
import canvasState from "../store/canvasState";
import Brush from "../tools/Brush";
import toolState from "../store/toolState";
import {Button, Modal} from "react-bootstrap";
import {useParams} from "react-router-dom";
import Rect from "../tools/Rect";
import axios from "axios";

const Canvas = observer(() => {
    const canvasRef  = useRef();
    const usernameRef = useRef();
    const [modal, setModal] = useState(true);
    const params = useParams();
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (canvasState.username) {
            const socket = new WebSocket("ws://localhost:5000");
            canvasState.setSocket(socket);
            canvasState.setSessionid(params.id);
            toolState.setTool(new Brush(canvasRef.current, socket, params.id));
            socket.onopen = () => {
                console.log("Connected!");
                socket.send(JSON.stringify({
                    id: params.id,
                    username: canvasState.username,
                    method: "connection",
                }))
            }
            socket.onmessage = (e) => {
                let msg = JSON.parse(e.data);
                switch (msg.method) {
                    case "connection":
                        console.log(`User ${msg.username} connected!`);
                        break
                    case "draw":
                        drawHandler(msg)
                        break
                }
            }
        }
    },[canvasState.username])

    const drawHandler = (msg) => {
        const figure = msg.figure;
        const ctx = canvasRef.current.getContext('2d')
        switch (figure.type) {
            case "brush":
                Brush.draw(ctx,figure.x,figure.y)
                break
            case "rect":
                Rect.staticDraw(ctx,figure.x,figure.y, figure.width,figure.height, figure.color)
                break
            case "finish":
                ctx.beginPath()
                break
        }
    }

    const loadImage = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/image/?id=${params.id}`);

            if (response.data && response.data !== 'null') {
                const img = new Image()
                img.src = response.data
                img.onload = () => {
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        setImageLoaded(true);
                    }
                }
                img.onerror = () => {
                    console.log("Не удалось загрузить изображение");
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                }
            } else {
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
        } catch (error) {
            console.log("Ошибка загрузки изображения (скорее всего файл не найден):", error.message);
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };

    const setCanvasRef = (element) => {
        canvasRef.current = element;
        if (element) {
            canvasState.setCanvas(element);
            loadImage();
        }
    };

    const mouseDownHandler = () => {
        canvasState.pushToUndo(canvasRef.current.toDataURL());
    }

    const mouseUpHandler = () => {
        if (canvasRef.current) {
            axios.post(`http://localhost:5000/image?id=${params.id}`, {img: canvasRef.current.toDataURL()})
                .then(res => console.log("Изображение сохранено:", res.data))
                .catch(err => console.error("Ошибка сохранения:", err));
        }
    }

    const connectHandler = () => {
        canvasState.setUsername(usernameRef.current.value);
        setModal(false)
    }

    return (
        <div className="canvas">
            <Modal show={modal} onHide={() => {}}>
                <Modal.Header closeButton>
                    <Modal.Title>Введите ваше имя</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input type="text" ref={usernameRef}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => connectHandler()}>
                        Войти
                    </Button>
                </Modal.Footer>
            </Modal>
            <canvas
                onMouseUp={() => mouseUpHandler()}
                onMouseDown={() => mouseDownHandler()}
                ref={setCanvasRef}
                width={600}
                height={400}
                style={{border: '1px solid black', backgroundColor: 'white'}}
            />
        </div>
    );
});

export default Canvas;