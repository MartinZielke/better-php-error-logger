# better-php-error-logger

With this extension you can use the error_log function in PHP with keyboard shortcuts. There are some customization options.
Here is a list of shotcuts you can use. 

| Shortcuts 	     | Description                               	                                                               |  Why                                    |
|------------------- |---------------------------------------------------------------------------------------------------------------- |---------------------------------------- |
| `Ctrl + Alt + D`   | To to error log when a variable is selected. 	                                                               | D for Default. 	                 |
| `Ctrl + Alt + C`   | To also print call stack. (No Call Stack, when it is true for default in settings)                              | C for Call Stack.                       | 
| `Ctrl + Alt + V`   | To var_dump variable. (No Var dump, when it is true for default in settings)                                    | V for var_dump.                         |
| `Ctrl + Alt + E`   | To use Echo instead.  (No Use Echo instead, when it is true for default in settings)                            | E for Echo.                             |
| `Ctrl + Alt + O D` | To print current output buffer with default settings.                                                           | O for Output buffer.                    |
| `Ctrl + Alt + O C` | To print current output buffer with call stack. (No Call Stack, when it is true for default in settings)        |                                         | 
| `Ctrl + Alt + O V` | To print current output buffer with var dumped variable. (No Var dump, when it is true for default in settings) |                                         |
| `Ctrl + Alt + O E` | To echo current output buffer. (No Use Echo instead, when it is true for default in settings)                   |                                         |    
| `Ctrl + Alt + X`   | To delete all error_logs, var_dumps, echos with () and \<br> inside a file                                      | X for when something is crossed over :) |

You can change the keyboard shortcuts in VS Code shortcut settings. 

In VS Code settings or `settings.json`, you can change some settings.

To change what will be error logged you can set `betterPhpErrorLogger.errorLogs` to an array of strings, where each value string will be error logged.  
You can use `${selectedVar}` for the selected variable.  Use `${selectedVarString}` for the name of the variable, by default the two values are the same.  
The exception is when var_dumping variable:  
- when echoing `${selectedVar}` will be changed to "var_dump(`${selectedVar}`) " 
- when error_logging a new variable will be created called "$var_dump", which gets the output buffer

The default values are:  
```json
[
    "'${selectedVarString}: ' . print_r(${selectedVar}, true)",
    "'in ' . __FILE__ . ' on line ' . __LINE__"
]
```
You can use a default variable when no variable is selected, change `betterPhpErrorLogger.defaultVariable` to do that. The default values are:  

```json
{  
    "name": "$here",  
    "value": "__CLASS__ . '::' . __FUNCTION__"  
}
```

You can change some settings to always use them when using the default shotcut `Ctrl + Alt + D`.

Set `betterPhpErrorLogger.printCallStack` to an object with the property printCallStack set to true to also print call stack. You can also choose to print the call stack as an array, if you set the property printCallStackAsArray as array to true.  
Set `betterPhpErrorLogger.useEchoInstead` to true to echo instead of error_log.  
Set `betterPhpErrorLogger.varDumpVariable` to true to var_dump variable.
If you have any of these settings set to true for the default shortcut, it will do the opposite when you use the shortcut for them, like it says in the description for the shortcuts above.
For the other settings things it will use your defaults.

Deletion may not work correctly.