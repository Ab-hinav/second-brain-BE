
/**
 * Lightweight empty check for common value types used in this codebase.
 * - null/undefined/empty-string -> true
 * - object with no own keys -> true
 */
export const isEmpty = (obj:object | string | null | undefined) =>{

    if(obj == null) return true;
    if(obj == undefined) return true;
    if(obj == "") return true;

    if(typeof obj == 'object'){
        return Object.keys(obj).length===0
    }
    return false;
}
