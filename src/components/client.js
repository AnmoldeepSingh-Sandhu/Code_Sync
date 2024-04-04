import React from "react"
import Avatar from 'react-avatar'

const Client = ({userName}) =>{
    return(
        <div className="client">
            {/* Avater is reacts inbuild functionality */}
            <Avatar name={userName} size={50} round='14px'/>
            <span className="userName">{userName}</span>
        </div>
    )
}

export default Client