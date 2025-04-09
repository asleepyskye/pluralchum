import { pluginName } from './utility';

const Logger = BdApi.Logger;

export const ProfileType = {
    Member: 'members',
    System: 'systems'
}

export class PluralchumCache{
    constructor() {
        this.dbName = "pluralchum_cache";
        this.db = null;
        this.DB_VERSION = 1;
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
            //TODO: handle plugin update, set profiles to stale
            Logger.debug(pluginName, 'Database upgrading...');
            const db = event.target.result;
            if (!db.objectStoreNames.contains(ProfileType.Member)){
                db.createObjectStore(ProfileType.Member, { keyPath: 'hash' });
            }
            if (!db.objectStoreNames.contains(ProfileType.System)){
                db.createObjectStore(ProfileType.System, { keyPath: 'id' });
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

    async cache(type, profile){
        return this.operation(type, 'readwrite', (objectStore)=>{
            const request = objectStore.put(profile);
            return new Promise((resolve, reject) =>{
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async update(type, key, callback){
        return this.operation(type, 'readwrite', (objectStore)=>{
            const request = objectStore.get(key);
            return new Promise((resolve, reject) =>{
                request.onerror = () => reject(request.error);
                request.onsuccess = (event) => {
                    let data = event.target.result.status;
                    callback(data).then((updatedData) => {
                        const requestUpdate = objectStore.put(updatedData);
                        requestUpdate.onerror = () => reject(request.error);
                        requestUpdate.onsuccess = (event) => {
                            resolve();
                        };
                    })
                };
            });
        });
    }
    
    async get(type, key){
        return this.operation(type, 'readonly', (objectStore)=>{
            const request = objectStore.get(key);
            return new Promise((resolve, reject) =>{
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    resolve(request.result);
                };
            });
        });
    }
    
    async purgeOld(){}
    async clear(){}

    close(){
        if (this.db){
            this.db.close();
            this.db = null;
        }
    }
}