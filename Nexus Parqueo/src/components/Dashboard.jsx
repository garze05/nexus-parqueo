import React from 'react';
import UlacitLogo from '/src/assets/ulacit-logo.png';


const Dashboard = () => {
    return (
        <div className="p-5 flex flex-col justify-center items-center">
            <img src={UlacitLogo} alt="Ulacit Logo"></img>
            <h1 className="mt-10 font-bold text-5xl">Bienvenido a Parqueos ULACIT</h1>
            <p className="mt-5 font-semibold text-xl">Usted es (rol)</p>
        </div>
    );
};

export default Dashboard;