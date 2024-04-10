import React, { useState } from 'react'
import {v4 as uuidV4} from 'uuid'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Home = () =>{

    const navigate = useNavigate()

    const [roomId, setRoomId] = useState('');
    const [userName, setUserName] = useState('');


    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    }

    const joinRoom = () =>{
        if(!roomId || !userName){
            toast.error('Room ID & Username is required');
            return
        }

        //Redirect to editor page
        navigate(`/editor/${roomId}`, {
            state:{
                userName,
            }
        })
    }

    const handleInputEnter = (e) =>{
        if(e.code === 'Enter'){
            joinRoom();
        }

    }

    return(
        <div className='homePageWrapper'>
            <div className='formWrapper'>
                <h1 className='title'>Code Sync</h1>
                <h4 className='subtitle'>Collaboration for Coders</h4>

                <fieldset className='joinRoom'>
                    <legend>Join Room</legend>
                        <div className='inputGroup'>
                            <input 
                                type='text' 
                                className='inputBox primaryBox' 
                                placeholder='ROOM ID' 
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                onKeyUp={handleInputEnter}
                            />
                        </div>
                        <div className='inputGroup'>
                            <input 
                                type='text' 
                                className='inputBox' 
                                placeholder='USERNAME'
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onKeyUp={handleInputEnter}
                            />

                        </div>
                        <button className='btn joinBtn' onClick={joinRoom}>Join</button>
                </fieldset>
                <br/>
                <fieldset className='joinRoom'>
                    <legend> Create New Room</legend>
                    <button onClick={createNewRoom} className='btn createBtn'>New Room</button>
                </fieldset>
            </div>

            <footer>
                <h4>Built with ❤️ by &nbsp;
                    <a href='https://github.com/AnmoldeepSingh-Sandhu'>Anmoldeep Singh</a>
                </h4>
            </footer>

        </div>
    )
}

export default Home