using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal static class Launcher
{
    private const uint JobObjectExtendedLimitInformation = 9;
    private const uint JobObjectLimitKillOnJobClose = 0x00002000;
    private static Mutex singleInstance;

    [StructLayout(LayoutKind.Sequential)]
    private struct BasicLimitInformation
    {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IoCounters
    {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct ExtendedLimitInformation
    {
        public BasicLimitInformation BasicLimitInformation;
        public IoCounters IoInfo;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryUsed;
        public UIntPtr PeakJobMemoryUsed;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateJobObject(IntPtr attributes, string name);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetInformationJobObject(IntPtr job, uint infoClass, IntPtr info, uint infoLength);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr handle);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint GetConsoleProcessList([Out] uint[] processIds, uint bufferCount);

    private static int Main(string[] args)
    {
        int result = Run(args);
        if (result != 0 && !Console.IsInputRedirected && !Console.IsOutputRedirected &&
            GetConsoleProcessList(new uint[2], 2) == 1)
        {
            Console.WriteLine("Press Enter to close this window.");
            Console.ReadLine();
        }
        return result;
    }

    private static int Run(string[] args)
    {
        bool skipPhotos = false;
        bool noBrowser = false;
        foreach (string arg in args)
        {
            if (arg == "--skip-photos") skipPhotos = true;
            else if (arg == "--no-browser") noBrowser = true;
            else if (arg == "--help" || arg == "-h")
            {
                Console.WriteLine("Usage: START.exe [--skip-photos] [--no-browser] [--help]");
                Console.WriteLine("Starts the local ROLX Store API, MongoDB and storefront. Press Ctrl+C to stop app processes.");
                return 0;
            }
            else
            {
                Console.Error.WriteLine("Unknown option: " + arg);
                Console.Error.WriteLine("Use --help to see supported options.");
                return 2;
            }
        }

        string repositoryRoot = FindRepositoryRoot();
        if (repositoryRoot == null)
        {
            Console.Error.WriteLine("StoreProject sources were not found beside START.exe or in the current folder.");
            Console.Error.WriteLine("Download or clone the repository, extract it, then place START.exe at the repository root beside client and server.");
            return 2;
        }

        bool created;
        try { singleInstance = new Mutex(true, "Local\\ROLX.StoreProject.START", out created); }
        catch
        {
            Console.Error.WriteLine("Could not create the single-launch guard. Close another launcher and try again.");
            return 2;
        }
        if (!created)
        {
            Console.Error.WriteLine("The StoreProject launcher is already running. Use that window or stop it with Ctrl+C first.");
            return 2;
        }

        IntPtr job = IntPtr.Zero;
        Process runtime = null;
        string temporaryScript = null;
        string readySignal = null;
        ConsoleCancelEventHandler cancelHandler = delegate(object sender, ConsoleCancelEventArgs eventArgs)
        {
            eventArgs.Cancel = true;
        };
        try
        {
            Console.CancelKeyPress += cancelHandler;
            string script;
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("ROLX.Runtime.ps1"))
            {
                if (stream == null) throw new InvalidOperationException("The embedded runtime script is missing. Rebuild START.exe.");
                using (StreamReader reader = new StreamReader(stream, Encoding.UTF8)) script = reader.ReadToEnd();
            }

            temporaryScript = Path.Combine(Path.GetTempPath(), "ROLX-StoreProject-" + Guid.NewGuid().ToString("N") + ".ps1");
            if (!noBrowser) readySignal = temporaryScript + ".ready";
            File.WriteAllText(temporaryScript, script, new UTF8Encoding(true));
            ProcessStartInfo start = new ProcessStartInfo();
            start.FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell\\v1.0\\powershell.exe");
            if (!File.Exists(start.FileName)) start.FileName = "powershell.exe";
            start.Arguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File " + QuoteArgument(temporaryScript);
            start.UseShellExecute = false;
            start.CreateNoWindow = false;
            start.WorkingDirectory = repositoryRoot;
            start.EnvironmentVariables["ROLX_PROJECT_ROOT"] = repositoryRoot;
            start.EnvironmentVariables["ROLX_SKIP_PHOTOS"] = skipPhotos ? "1" : "0";
            start.EnvironmentVariables["ROLX_READY_SIGNAL"] = readySignal ?? "";

            runtime = new Process();
            runtime.StartInfo = start;
            if (!runtime.Start()) throw new InvalidOperationException("Could not start the Windows PowerShell runtime.");
            job = CreateKillOnCloseJob();
            if (job != IntPtr.Zero && !AssignProcessToJobObject(job, runtime.Handle))
            {
                CloseHandle(job);
                job = IntPtr.Zero;
                Console.WriteLine("Note: Windows could not attach a process cleanup job; the launcher still performs Ctrl+C cleanup.");
            }
            bool browserOpened = false;
            while (!runtime.WaitForExit(500))
            {
                if (browserOpened || readySignal == null || !File.Exists(readySignal)) continue;
                browserOpened = true;
                try { Process.Start(new ProcessStartInfo("http://localhost:5173") { UseShellExecute = true }); }
                catch { Console.WriteLine("Open http://localhost:5173 in your browser."); }
            }
            return runtime.ExitCode;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Launcher error: " + ex.Message);
            return 1;
        }
        finally
        {
            Console.CancelKeyPress -= cancelHandler;
            if (job != IntPtr.Zero) CloseHandle(job);
            if (runtime != null) runtime.Dispose();
            if (temporaryScript != null)
            {
                try { File.Delete(temporaryScript); } catch { }
            }
            if (readySignal != null)
            {
                try { File.Delete(readySignal); } catch { }
            }
            if (singleInstance != null)
            {
                try { singleInstance.ReleaseMutex(); } catch { }
                singleInstance.Dispose();
            }
        }
    }

    private static string QuoteArgument(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }

    private static IntPtr CreateKillOnCloseJob()
    {
        IntPtr job = CreateJobObject(IntPtr.Zero, null);
        if (job == IntPtr.Zero) return IntPtr.Zero;
        IntPtr memory = IntPtr.Zero;
        try
        {
            ExtendedLimitInformation information = new ExtendedLimitInformation();
            information.BasicLimitInformation.LimitFlags = JobObjectLimitKillOnJobClose;
            memory = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(ExtendedLimitInformation)));
            Marshal.StructureToPtr(information, memory, false);
            if (!SetInformationJobObject(job, JobObjectExtendedLimitInformation, memory, (uint)Marshal.SizeOf(typeof(ExtendedLimitInformation))))
            {
                CloseHandle(job);
                return IntPtr.Zero;
            }
            return job;
        }
        finally
        {
            if (memory != IntPtr.Zero) Marshal.FreeHGlobal(memory);
        }
    }

    private static string FindRepositoryRoot()
    {
        string executableDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        string[] starts = new string[] { executableDirectory, Environment.CurrentDirectory };
        foreach (string start in starts)
        {
            DirectoryInfo current = null;
            try { current = new DirectoryInfo(start); } catch { }
            for (int depth = 0; current != null && depth < 6; depth++, current = current.Parent)
            {
                if (File.Exists(Path.Combine(current.FullName, "client", "package.json"))
                    && File.Exists(Path.Combine(current.FullName, "server", "package.json"))
                    && File.Exists(Path.Combine(current.FullName, "server", "compose.yaml")))
                    return current.FullName;
            }
        }
        return null;
    }
}
