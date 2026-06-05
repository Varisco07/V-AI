import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // CPU Usage
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times]
      }
      totalIdle += cpu.times.idle
    })
    
    const cpuUsage = 100 - (100 * totalIdle / totalTick)

    // Memory Usage
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsage = (usedMemory / totalMemory) * 100

    // System Info
    const platform = os.platform()
    const arch = os.arch()
    const hostname = os.hostname()
    const uptime = os.uptime()

    // Format uptime
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)

    return NextResponse.json({
      cpu: {
        usage: cpuUsage.toFixed(1),
        cores: cpus.length,
        model: cpus[0].model,
      },
      memory: {
        usage: memoryUsage.toFixed(1),
        total: (totalMemory / (1024 ** 3)).toFixed(2), // GB
        free: (freeMemory / (1024 ** 3)).toFixed(2), // GB
        used: (usedMemory / (1024 ** 3)).toFixed(2), // GB
      },
      system: {
        platform,
        arch,
        hostname,
        uptime: `${hours}h ${minutes}m`,
        uptimeSeconds: uptime,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('System metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    )
  }
}
