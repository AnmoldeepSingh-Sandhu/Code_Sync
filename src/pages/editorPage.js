import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Client from '../components/client';
import Editor from '../components/editor';
import Chat from '../components/chat';
import { initSocket } from '../socket';
import ACTIONS from '../actions';

const EditorPage = () =>{

    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const {roomId} = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [btnVisible, setBtnVisible] = useState(true);
    const [receivedMessage, setReceivedMessage] = useState([]);//this is for Chat component. 
    //I add it over here due to unmount problem when I click close btn of chat and open it again.
    const [executionResult, setExecutionResult] = useState("");// State to store the code execution result



    useEffect(() => {

        if (!socketRef.current) {
            const init = async () => {
                
                socketRef.current = await initSocket();
        
                socketRef.current.on('connect_error', (err) => handleErrors(err));
                socketRef.current.on('connect_failed', (err) => handleErrors(err));
                
                function handleErrors(e){
                    console.log('socket error', e);
                    toast.error('Socket connection failed, try again later.');
                    reactNavigator('/');
                };

                if (socketRef.current) {

                    socketRef.current.emit(ACTIONS.JOIN, {
                        roomId,
                        userName: location.state?.userName,
                    });

                    //Listening for JOINED event
                    socketRef.current.on(ACTIONS.JOINED, ({clients, user, socketId, history}) =>{

                        if(user !== location.state?.userName){
                            toast.success(`${user} joined the room.`)
                        };
                        setClients(clients);
                        if(history){
                            setReceivedMessage(history);
                        }
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                            code: codeRef.current,
                            socketId,
                        });
                    });



                    // Listening for DISCONNECTED
                    socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId,user}) =>{
                        toast.success(`${user} left the room`);
                        setClients((prev) => {
                            return prev.filter(client => client.socketId !== socketId);
                        });
                    });
                };

            };

            init();
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            };
        };

    }, []);


    async function copyRoomId(){
        try{
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has be copied to you clipboard');
        }catch(err){
            toast.error('Could not copy the Room ID');
        }
    };

    function leaveRoom(){
        reactNavigator('/');
    }

    function showChatSession(){
        setBtnVisible((prevVisible) => !prevVisible);
        setIsVisible((prevVisible) => !prevVisible);
    }


    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target.result;
            codeRef.current = contents;
            socketRef.current.emit(ACTIONS.FILE_UPLOAD, {
                roomId,
                code: contents,
            });
        };
        reader.readAsText(file);
    }


    //Save the Code
    function handleSaveFile() {
        const content = codeRef.current;
    
        // Request access to the file system
        window.showSaveFilePicker({
            suggestedName: 'filename.txt',
            types: [
                {
                    description: 'Text',
                    accept: {
                        'text/plain': ['.txt']
                    }
                },
                {
                    description: 'JavaScript',
                    accept: {
                        'application/javascript': ['.js']
                    }
                }
            ]
            
        }).then(fileHandle => {
            // Create a writable stream to the file
            return fileHandle.createWritable();

        }).then(writableStream => {
            // Write the content to the file
            writableStream.write(content);
            // Close the file and save changes
            return writableStream.close();

        }).catch(err => {
            console.error('Error saving file:', err);
        });
    };


    // Function to execute the code
    function executeCode() {
        // Get the code from the editor
        const code = codeRef.current;
        if(code){
            console.log("Executed");
            // Send the code to the server for execution
            socketRef.current.emit(ACTIONS.EXECUTE_CODE, {
                code,
            });

            // Listen for the result from the server
            socketRef.current.on(ACTIONS.CODE_EXECUTED, ({ result }) => {
                console.log("Result = ", result);
                setExecutionResult(result);
            });
        }
    }

    if(!location.state?.userName){
        return <Navigate to='/'/>
    }

    return(
        <div className='mainWrap'>

            <div className='aside'>

                <div className='asideInner'>

                    <div className='sideHeading'>
                        <h2 className='sideTitle'>Code Sync</h2>
                        <h6 className='sideSubtitle'>Collaboration for Coders</h6>
                    </div>

                    <h3 className='connected'>Connected</h3>

                    <div className='clientsList'>
                        {clients.map((client) => (
                            <Client key={client.socketId} userName={client.userName}/>
                        ))}
                    </div>
                </div>

                <input
                    id='fileInput'
                    type='file'
                    onChange={handleFileUpload}
                    accept='.txt, .js'
                    style={{ display: 'none' }}
                />
                
                <button className='btn copyBtn' onClick={copyRoomId}>Copy Room ID</button>
                <button  className='btn leaveBtn' onClick={leaveRoom}>Leave</button>

            </div>
            
            <div className='editorWrap'>
                <div className='editorButtons'>
                    <button className='btn uploadBtn' onClick={() => document.getElementById('fileInput').click()}>Upload File</button>
                    <button className='btn saveBtn' onClick={handleSaveFile}>Save File</button>
                    <button className="btn executeBtn" onClick={executeCode}>Execute Code</button>
                </div>

                <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => {codeRef.current = code}}/>
                {/* Display the execution result */}
                
                <div className="executionResult">
                    <h3>Execution Result:</h3>
                    <pre>{executionResult}</pre>
                </div>
            </div>



            {btnVisible && <button className='chatBtn' onClick={showChatSession}>Chat</button>}
            {isVisible && <div className='chatWrap'>
                <Chat 
                    setIsVisible={setIsVisible} 
                    setBtnVisible={setBtnVisible} 
                    socketRef={socketRef} 
                    roomId={roomId} 
                    user={location.state?.userName} 
                    receivedMessage={receivedMessage}
                    setReceivedMessage={setReceivedMessage}
                />
            </div>}

        </div>
    )
}

export default EditorPage
