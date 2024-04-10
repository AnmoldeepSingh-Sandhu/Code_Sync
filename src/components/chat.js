import React from "react";
import { useEffect, useState, useRef } from "react";
import ACTIONS from "../actions";


const Chat = ({setIsVisible, setBtnVisible, socketRef, roomId, user, receivedMessage, setReceivedMessage}) =>{

    const [message, setMessage] = useState("");
    const chatDataRef = useRef(null);
    

    function showChatSession(){
        setBtnVisible((prevVisible) => !prevVisible);
        setIsVisible((prevVisible) => !prevVisible);
    }

    function sendMessage(){
        if(message !== null){
            socketRef.current.emit(ACTIONS.SEND_MESSAGE, {
                roomId,
                message,
                user,
            });
            setMessage("");
        };
    };

    useEffect(() =>{
        if(socketRef.current){

            socketRef.current.on(ACTIONS.RECEIVE_MESSAGE, ({message, user})=>{
                setReceivedMessage(prevValue => [...prevValue, { message, user }]);
            });
        };

        return () => {
            if(socketRef.current){
                socketRef.current.off(ACTIONS.RECEIVE_MESSAGE);
            };
        };

    }, [socketRef.current]);


    // Scroll to the bottom of the chat area when messages change
    useEffect(() => {
        if (chatDataRef.current) {
            chatDataRef.current.scrollTop = chatDataRef.current.scrollHeight;
        }
    }, [receivedMessage]);


    const handleInputEnter = (e) =>{
        if(e.code === 'Enter'){
            sendMessage();
        }

    };

    return( 
        <div className="chatSubWrap">
            <div className="chatArea">
                <h1 className="chatHeading">Chat</h1>
                <button className="closeChatBtn" onClick={showChatSession}>X</button>
                <div className="chatData" ref={chatDataRef}>
                    {receivedMessage.map((message, index) =>(
            
                        (message.user === user && message.message ? <div key={index} className="thisUser"><span>{message.user}</span>{message.message}</div> : null) ||
                        (message.message ? <div key={index} className="forOtherUsers"><span>{message.user}</span>{message.message}</div> : null)

                    ))}
                </div>
            </div>
            <input type="text" className="chatInput" value={message} onKeyUp={handleInputEnter} onChange={(event) => {
                setMessage(event.target.value);
            }}/>
            <button className="sendBtn" onClick={sendMessage}>Send</button>
        </div>
    )
};

export default Chat
