import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51NXl9lSJcBM8rizCKPRTdl1ulF4SwTLdcJLZ6ttKJYj1AD4nJuiJNC00oTDfoIZqogbWmK4X1vSArHuKOEKA856O00Mj0iWjUI');

export const bookTour = async (tourId) => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);
        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};
