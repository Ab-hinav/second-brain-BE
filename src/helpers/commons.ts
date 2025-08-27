


export const isEmpty = (obj:object | string | null | undefined) =>{

    if(obj == null) return true;
    if(obj == undefined) return true;
    if(obj == "") return true;

    if(typeof obj == 'object'){
        return Object.keys(obj).length===0
    }

}