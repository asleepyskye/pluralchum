import { pluginName } from './utility';

const Logger = BdApi.Logger

export class PluralchumCache{
    constructor() {
        this.dbName = "pluralchum_cache";
        this.db = null;
        this.DB_VERSION = 1;
        this.MEMBER_STORE = 'members';
        this.SYSTEM_STORE = 'systems';
        this.onerror = (event) => {
            Logger.error(pluginName, 'Database error:', event.target.error)
        }
    }
    
    async init() {
        if(this.db) return;
        let request = await indexedDB.open(this.dbName, this.DB_VERSION);
        request.onerror = this.onerror;
        request.onsuccess = (event) => {
            this.db = event.target.result;
            Logger.debug(pluginName, 'Database opened');
        }
        request.onupgradeneeded = (event) => {
            Logger.debug(pluginName, 'Database upgrading...');
            const db = event.target.result;
            const transaction = event.target.transaction;
            if (!db.objectStoreNames.contains(this.MEMBER_STORE)){
                db.createObjectStore(this.MEMBER_STORE, { keyPath: 'hash' });
            }
            if (!db.objectStoreNames.contains(this.SYSTEM_STORE)){
                db.createObjectStore(this.SYSTEM_STORE, { keyPath: 'id' });
            }
            Logger.debug(pluginName, 'Database upgraded.');
        }
    }
    async operation(storeName, mode, callback){
        if(!this.db) return;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, mode);
            transaction.onerror = (event) => this.onerror(event);
            callback(transaction.objectStore(storeName))
                .then(resolve)
                .catch(reject);
        });
    }

    async cacheMember(member){
        return this.operation(this.MEMBER_STORE, 'readwrite', (objectStore)=>{
            const request = objectStore.put(member);
            return new Promise((resolve, reject) =>{
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }
    async cacheSystem(system){
        return this.operation(this.SYSTEM_STORE, 'readwrite', (objectStore)=>{
            const request = objectStore.put(system);
            return new Promise((resolve, reject) =>{
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }
    async updateSystemStatus(id, status){
        return this.operation(this.SYSTEM_STORE, 'readwrite', (objectStore)=>{
            const request = objectStore.get(id);
            return new Promise((resolve, reject) =>{
                request.onerror = () => reject(request.error);
                request.onsuccess = (event) => {
                    let data = event.target.result.status;
                    data.status = status;
                    const requestUpdate = objectStore.put(data);
                    requestUpdate.onerror = () => reject(request.error);
                    requestUpdate.onsuccess = (event) => {
                        resolve();
                    };
                };
            });
        });
    }
    async updateMemberStatus(hash, status){
        return this.operation(this.MEMBER_STORE, 'readwrite', (objectStore)=>{
            const request = objectStore.get(hash);
            return new Promise((resolve, reject) =>{
                request.onerror = () => reject(request.error);
                request.onsuccess = (event) => {
                    let data = event.target.result.status;
                    data.status = status;
                    const requestUpdate = objectStore.put(data);
                    requestUpdate.onerror = () => reject(request.error);
                    requestUpdate.onsuccess = (event) => {
                        resolve();
                    };
                };
            });
        });
    }
    async getMember(hash){
        return this.operation(this.MEMBER_STORE, 'readonly', (objectStore)=>{
            const request = objectStore.get(hash);
            return new Promise((resolve, reject) =>{
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    resolve(request.result);
                };
            });
        });
    }
    async getSystem(id){
        return this.operation(this.SYSTEM_STORE, 'readonly', (objectStore)=>{
            const request = objectStore.get(id);
            return new Promise((resolve, reject) =>{
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    resolve(request.result);
                };
            });
        });
    }
    purgeOld(){}
    clear(){}

    close(){
        if (this.db){
            this.db.close();
            this.db = null;
        }
    }
}