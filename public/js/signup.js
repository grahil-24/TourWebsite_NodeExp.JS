/* eslint-disable */

import axios from 'axios';

import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
    // AXIOS is a library used to send HTTP requests. It also returns a promise
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:8000/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm,
            },
        });

        showAlert('success', 'Signed up Successfully');
        // after logging in we will redirect the user to the home page after 1500 ms
        window.setTimeout(() => {
            location.assign('/');
        }, 1000);
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};
