import { useState } from "react"

export default function FormExample(){
    const [text, setText] = useState("")

    function handleChange(e){
        setText(e.target.value)
    }

    function handleSubmit(e){
        e.preventDefault();
        alert("Отправлено")
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" value={text} onChange={handleChange}/>
                <button type="submit">Отправить</button>
            </form>
        </div>
    );

}