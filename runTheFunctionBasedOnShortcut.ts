import * as vscode from 'vscode';
import { TextEditor, TextEditorEdit } from "vscode";
import { symbolFinderLoop } from "./symbolFinderLoop";
import { getIndentation } from "./getIndentation";
import { isBalanced } from "./isBalanced";
import { getSelectionType } from './getSelectionType';


export function runTheFunctionBasedOnShortcut(args: string) {
    const editor: TextEditor | undefined = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    if (document.languageId !== "php") {
        return;
    }

    const configurations = vscode.workspace.getConfiguration('betterPhpErrorLogger');


    //Get all selected text
    //const allSelectedText = editor.selections.map(selection => document.getText(selection));

    const selection = editor.selection;
    let selectedVar: string = document.getText(selection);
    const selectionType = getSelectionType(document.fileName, selection, selectedVar, document.getText());

    let selectedVarString = selectedVar.replaceAll(`'`, ``).replaceAll(`"`, ``);
    let selectedLine = selection.active.line;
    const indentation = getIndentation(editor, document, selectedLine);

    //Check if the keyboard args are set and and get the opposite of settings if they are set else use settings from configuration
    const useEchoInstead: string = (args === `useEchoInstead` || args === 'printCurrentOutputBufferUseEcho') ? !configurations.useEchoInstead : configurations.useEchoInstead;
    const printWithCallStack: string = (args === `printWithCallStack` || args === 'printCurrentOutputBufferWithCallStack') ? !configurations.printWithCallStack.printWithCallStack : configurations.printWithCallStack.printWithCallStack;
    const varDumpVariable: string = (args === `varDumpVariable` || args === 'printCurrentOutputBufferVarDump') ? !configurations.varDumpVariable : configurations.varDumpVariable;

    let position = 1;

    // Change selectedVarString and selectedVar if outputbuffer is being printed.
    const printCurrentOutputBuffer = ["printCurrentOutputBuffer", 'printCurrentOutputBufferUseEcho', 'printCurrentOutputBufferWithCallStack', 'printCurrentOutputBufferVarDump'];
    selectedVarString = printCurrentOutputBuffer.includes(args) ? "Output buffer" : selectedVarString;
    selectedVar = printCurrentOutputBuffer.includes(args) ? "ob_get_contents()" : selectedVar;
    position = printCurrentOutputBuffer.includes(args) ? 0 : position;

    let errorLogString = `error_log`;
    let newLine = ``;


    //Check if the braces in the selected variable are balanced
    if (!isBalanced(selectedVar)) {
        vscode.window.showErrorMessage(`Braces in the selected value are not balanced`);
        return;
    }
    //Check if the selected variable not includes ;
    if (selectedVar.includes(';')) {
        vscode.window.showErrorMessage(`The selected value can not include ;`);
        return;
    }

    //If { is not on same line as function call, then move to the line with the {
    if (selectionType === 'function_parameter' || selectionType === 'switch_variable') {
        //Find first occurence of { after function
        selectedLine = symbolFinderLoop(document, selectedLine - 1, '{');
    }

    if (selectionType === 'switch_variable') {
        //Find the } after the switch
        //Function where you pass string and index of first bracket and returns index of the matching bracket
        // function matchBrackets(string, index) {
        //     let openBrackets = 0;
        //     let closeBrackets = 0;
        //     for (let i = index; i < string.length; i++) {
        //         if (string[i] === '{') {
        //             openBrackets++;
        //         } else if (string[i] === '}') {
        //             closeBrackets++;
        //         }
        //         if (openBrackets === closeBrackets) {
        //             return i;
        //         }
        //     }
        //     return -1;
        // }
        selectedLine = symbolFinderLoop(document, selectedLine + 2, '}');
    }

    //If selected line contains array and the next non-whitespace line is a (, then move to the first line with ;
    if (selectionType === 'assigned_variable') {
        selectedLine = symbolFinderLoop(document, selectedLine, ';');
    }

    editor.edit((editBuilder: TextEditorEdit) => {

        // Check if the selected variable is empty, if so, get the default selected variable
        if (selectedVar.trim().length === 0) {
            selectedVarString = configurations.defaultVariable.name;
            selectedVar = configurations.defaultVariable.value;
            position = 0;
        }

        let parantheseLeft = `(`;
        let parantheseRight = `)`;

        if (useEchoInstead) {
            errorLogString = `echo`;
            newLine = ` . "<br>"`;
            parantheseLeft = ` `;
            parantheseRight = ``;
        }

        // let varDumpString = `\${"${selectedVar.replaceAll(`'`, ``).replaceAll(`"`, ``).replaceAll(`$`, `💲`)}"}`;


        let outbutbufferVariable = `$_ob`;
        if (varDumpVariable) {
            let varDumpSelectedVar = `var_dump(${selectedVar})`;

            if (!useEchoInstead) {

                let ob_start = `${indentation}ob_start();\n`;

                if (printCurrentOutputBuffer.includes(args)) {
                    varDumpSelectedVar = `var_dump(${outbutbufferVariable}=${selectedVar})`;
                    ob_start = ``;
                }
                // let varDumpNewVar = `$var_dump`;
                editBuilder.insert(
                    new vscode.Position(selectedLine + position, 0),
                    `${ob_start}${indentation}${varDumpSelectedVar};\n`
                    //+
                    // `${indentation}${varDumpNewVar} = rtrim(ob_get_clean()); \n`
                );
                selectedVar = 'rtrim(ob_get_clean())';
            } else {
                selectedVar = varDumpSelectedVar;
            }
        }

        configurations.errorLogs.forEach((errorLog: string): void => {
            //selectedVar = selectedVar.replaceAll('$$', '\$$$$$');

            errorLog = errorLog.replaceAll("${selectedVarString}", selectedVarString).replaceAll("${selectedVar}", selectedVar);

            if (varDumpVariable && useEchoInstead) {

                //Get index of all selecedVAr
                let selectedVarIndexes = [];
                let selectedVarIndex = errorLog.indexOf(selectedVar);
                while (selectedVarIndex !== -1) {
                    selectedVarIndexes.push(selectedVarIndex);
                    selectedVarIndex = errorLog.indexOf(selectedVar, selectedVarIndex + 1);
                }

                selectedVarIndexes.forEach(selectedVarIndex => {

                    //Get last period before selectedVar in errorLog
                    let lastPeriod = errorLog.lastIndexOf('.', selectedVarIndex);

                    // Replace it with a comma if found
                    if (lastPeriod !== -1) {
                        errorLog = `${errorLog.substring(0, lastPeriod)},${errorLog.substring(lastPeriod + 1)}`;
                    }
                })
            }

            editBuilder.insert(
                new vscode.Position(selectedLine + position, 0),
                `${indentation}${errorLogString}${parantheseLeft}${errorLog}${newLine}${parantheseRight}; \n`
            );
        });

        if (printCurrentOutputBuffer.includes(args) && varDumpVariable) {
            editBuilder.insert(
                new vscode.Position(selectedLine + position, 0),
                `echo ${outbutbufferVariable}; \n`
            );
        }


        if (printWithCallStack) {
            let getTrace = `getTrace`;

            if (!configurations.printWithCallStack.printCallStackAsArray) {
                getTrace += `AsString`;
            }

            editBuilder.insert(
                new vscode.Position(selectedLine + position, 0),
                `${indentation}${errorLogString}${parantheseLeft} (new \\Exception()) -> ${getTrace}()${newLine}${parantheseRight}; \n`
            );
        }

    });
}