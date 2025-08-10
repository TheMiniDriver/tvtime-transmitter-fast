const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Production Scripts', () => {
  const killScriptPath = path.join(__dirname, '..', 'kill-prod.sh');
  const runScriptPath = path.join(__dirname, '..', 'run-prod.sh');
  
  describe('kill-prod.sh script', () => {
    test('should exist and be executable', () => {
      expect(fs.existsSync(killScriptPath)).toBe(true);
      
      const stats = fs.statSync(killScriptPath);
      expect(stats.mode & parseInt('111', 8)).toBeTruthy(); // Check if executable
    });
    
    test('should handle case when no transmitter processes are running', (done) => {
      exec('bash ' + killScriptPath, (error, stdout, stderr) => {
        // Should not error even if no processes are found
        expect(error).toBeNull();
        expect(stdout).toContain('TV Time Transmitter shutdown complete');
        done();
      });
    });
    
    test('should contain specific process targeting logic', () => {
      const scriptContent = fs.readFileSync(killScriptPath, 'utf-8');
      
      // Check that it uses specific process matching instead of pkill node
      expect(scriptContent).toContain('pgrep -f "node app.js"');
      expect(scriptContent).not.toContain('pkill node');
      
      // Should still contain ffmpeg handling
      expect(scriptContent).toContain('ffmpeg');
      
      // Should have informative output
      expect(scriptContent).toContain('echo');
    });
    
    test('should use graceful termination before force kill', () => {
      const scriptContent = fs.readFileSync(killScriptPath, 'utf-8');
      
      // Check for graceful kill followed by force kill if needed
      expect(scriptContent).toContain('kill $TRANSMITTER_PIDS');
      expect(scriptContent).toContain('kill -9');
      expect(scriptContent).toContain('sleep');
    });
  });
  
  describe('run-prod.sh script', () => {
    test('should exist and be executable', () => {
      expect(fs.existsSync(runScriptPath)).toBe(true);
      
      const stats = fs.statSync(runScriptPath);
      expect(stats.mode & parseInt('111', 8)).toBeTruthy(); // Check if executable
    });
    
    test('should start the app with node app.js', () => {
      const scriptContent = fs.readFileSync(runScriptPath, 'utf-8');
      expect(scriptContent).toContain('node app.js');
    });
  });
  
  describe('Process targeting logic', () => {
    test('should correctly identify transmitter command pattern', (done) => {
      // Test the pgrep pattern used in the kill script
      exec('pgrep -f "node app.js" || echo "No processes found"', (error, stdout, stderr) => {
        // Should not error regardless of whether processes are found
        expect(error).toBeNull();
        
        // Output should either be process IDs or "No processes found"
        expect(stdout.trim()).toMatch(/^(\d+(\s+\d+)*|No processes found)$/);
        done();
      });
    });
    
    test('should not match other node processes', (done) => {
      // Start a dummy node process with different command
      const dummyProcess = spawn('node', ['-e', 'setTimeout(() => {}, 5000)'], {
        detached: true,
        stdio: 'ignore'
      });
      
      setTimeout(() => {
        // Check that our pattern doesn't match this process
        exec('pgrep -f "node app.js"', (error, stdout, stderr) => {
          const transmitterPids = stdout.trim().split('\n').filter(pid => pid);
          
          // Verify the dummy process is not in the transmitter PIDs
          exec(`ps -p ${dummyProcess.pid} -o pid --no-headers`, (psError, psStdout, psStderr) => {
            if (!psError && psStdout.trim()) {
              // Dummy process exists, make sure it's not in transmitter PIDs
              expect(transmitterPids).not.toContain(dummyProcess.pid.toString());
            }
            
            // Clean up dummy process
            process.kill(dummyProcess.pid, 'SIGTERM');
            done();
          });
        });
      }, 100);
    });
  });
});