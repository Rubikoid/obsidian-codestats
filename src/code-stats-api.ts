// original license: MIT
// Authored by Juha Ristolainen
// src: https://gitlab.com/juha.ristolainen/code-stats-vscode/-/blob/master/src/code-stats-api.ts

import { Pulse } from "./pulse";
import { getISOTimestamp, getLanguageName } from "./utils";
import * as axios from "axios";

export class CodeStatsAPI {
    private API_KEY: string | null = null;
    private USER_NAME: string | null = null;
    private UPDATE_URL = "https://codestats.net/api/";

    private axios: axios.AxiosInstance | null = null;

    constructor(apiKey: string | null, apiURL: string, userName: string | null) {
        this.updateSettings(apiKey, apiURL, userName);
    }

    public updateSettings(apiKey: string | null, apiURL: string, userName: string | null) {

        this.API_KEY = apiKey;
        this.UPDATE_URL = apiURL;
        this.USER_NAME = userName;

        if (
            this.API_KEY === null ||
            this.API_KEY === undefined ||
            this.API_KEY === ""
        ) {
            return;
        }

        this.axios = axios.default.create({
            baseURL: this.UPDATE_URL,
            timeout: 10000,
            headers: {
                "X-API-Token": this.API_KEY,
                "Content-Type": "application/json"
            }
        });
    }

    public sendUpdate(pulse: Pulse): axios.AxiosPromise {
        // If we did not have API key, don't try to update
        if (this.axios === null) {
            return null;
        }

        // tslint:disable-next-line:typedef
        const data = new ApiJSON(new Date());

        for (let lang of pulse.xps.keys()) {
            let languageName: string = getLanguageName(lang);
            let xp: number = pulse.getXP(lang);
            data.xps.push(new ApiXP(languageName, xp));
        }

        let json: string = JSON.stringify(data);
        console.log(`JSON: ${json}`);

        return this.axios
            .post("my/pulses", json)
            .then(response => {
                console.log(response);
            })
            .then(() => {
                pulse.reset();
            })
            .catch(error => {
                console.log(error);
            });
    }

    public getProfile(): axios.AxiosPromise {
        return this.axios
            .get(`users/${this.USER_NAME}`)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error);
                return null;
            });
    }
}

class ApiJSON {
    constructor(date: Date) {
        this.coded_at = getISOTimestamp(new Date());
        this.xps = new Array<ApiXP>();
    }

    coded_at: string;
    xps: Array<ApiXP>;
}

class ApiXP {
    constructor(language: string, xp: number) {
        this.language = language;
        this.xp = xp;
    }

    language: string;
    xp: number;
}
