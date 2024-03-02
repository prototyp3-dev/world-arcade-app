import { useEffect } from "react"
import { Chart } from "chart.js";
import { envClient } from "../utils/clientEnv";
import { ethers } from "ethers";



export default function LineChart({balances}) {
  useEffect(() => {
    var ctx = document.getElementById('myChart').getContext('2d');

    let labels = [];
    let data = [];

    for (let i = 0; i < balances.length; i++) {
      const d = new Date(Number(balances[i]._timestamp)*1000)
      const day = d.getDay();
      const month = d.getMonth();
      const year = d.getFullYear();

      labels.push(`${month}/${day}/${year}`);
      data.push(Number(ethers.utils.formatUnits(`${balances[i].balance}`, envClient.ACCPTED_TOKEN_DECIMALS)))
    }

    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          label: "Balance",
          borderColor: "#FFFFFF",
          backgroundColor: "#FFFFFF",
          fill: false,
        }]
      },
    });
  }, [balances])



  return (
    <div className="">
      {/* line chart */}
      <div className="w-[320px] md:w-[480px] lg:w-[720px]">
        <div className='border border-gray-400 rounded w-full h-fit'>
          <canvas id='myChart'></canvas>
        </div>
      </div>
    </div>
  )
}

