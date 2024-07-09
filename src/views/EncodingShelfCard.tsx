// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FC, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { DataFormulatorState, dfActions, dfSelectors, fetchFieldSemanticType, generateFreshChart } from '../app/dfSlice';

import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader,
    ListItemIcon,
    ListItemText,
    IconButton,
    Tooltip,
    TextField,
    Stack,
    Card,
    Chip,
} from '@mui/material';

import React from 'react';

import { Channel, EncodingItem, ConceptTransformation, Chart, FieldItem, Trigger, duplicateChart } from "../components/ComponentType";

import _ from 'lodash';

import '../scss/EncodingShelf.scss';
import { createDictTable, DictTable }  from "../components/ComponentType";

import { getUrls, resolveChartFields } from '../app/utils';
import { EncodingBox } from './EncodingBox';

import { ChannelGroups, CHART_TEMPLATES, getChartTemplate } from '../components/ChartTemplates';
import { getDataTable } from './VisualizationView';
import TableRowsIcon from '@mui/icons-material/TableRowsOutlined';
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';

import { findBaseFields } from './ViewUtils';
import { AppDispatch } from '../app/store';
import PrecisionManufacturing from '@mui/icons-material/PrecisionManufacturing';
import { Type } from '../data/types';

// Property and state of an encoding shelf
export interface EncodingShelfCardProps { 
    chartId: string;
    trigger?: Trigger;
    noBorder?: boolean;
}

let selectBaseTables = (activeFields: FieldItem[], conceptShelfItems: FieldItem[], tables: DictTable[]) : DictTable[] => {
    
    // if there is no active fields at all!!
    if (activeFields.length == 0) {
        return [tables[0]];
    }

    let activeBaseFields = conceptShelfItems.filter((field) => {
        return activeFields.map(f => f.source == "derived" ? findBaseFields(f, conceptShelfItems).map(f2 => f2.id) : [f.id]).flat().includes(field.id);
    });

    let activeOriginalFields = activeBaseFields.filter(field => field.source == "original");
    let activeCustomFields = activeBaseFields.filter(field => field.source == "custom");
    let activeDerivedFields = activeFields.filter(f => f.source == "derived");

    if (activeOriginalFields.length == 0 && activeFields.length > 0 && tables.length > 0) {
        return [tables[0]];
    }

    let baseTables = tables.filter(t => activeOriginalFields.map(f => f.tableRef as string).includes(t.id));

    return baseTables
}

export const TriggerCard: FC<{className?: string, trigger: Trigger, hideFields?: boolean, label?: string}> = function ({ label, className, trigger, hideFields }) {

    const charts = useSelector((state: DataFormulatorState) => state.charts);
    let fieldItems = useSelector((state: DataFormulatorState) => state.conceptShelfItems);
    const focusedChartId = useSelector((state: DataFormulatorState) => state.focusedChartId);

    const dispatch = useDispatch<AppDispatch>();

    let encodingComp : any = ''
    let prompt = trigger.instruction ? `"${trigger.instruction}"` : "";

    // console.log(trigger)

    if (trigger.chartRef && charts.find(c => c.id == trigger.chartRef)) {

        // console.log('chartRef')
        // console.log(trigger.chartRef)

        let chart = charts.find(c => c.id == trigger.chartRef) as Chart;
        let encodingMap = chart?.encodingMap;

        encodingComp = Object.entries(encodingMap)
            .filter(([channel, encoding]) => {
                return encoding.fieldID != undefined;
            })
            .map(([channel, encoding], index) => {
                let field = fieldItems.find(f => f.id == encoding.fieldID) as FieldItem;
                return [index > 0 ? '⨉' : '', 
                        <Chip sx={{color:'inherit', maxWidth: '110px', marginLeft: "2px", height: 18, fontSize: 12, borderRadius: '4px', 
                                   border: '1px solid rgb(250 235 215)', background: 'rgb(250 235 215 / 70%)',
                                   '& .MuiChip-label': { paddingLeft: '6px', paddingRight: '6px' }}} 
                              label={`${field.name}`} />]
            })
    }

    return <Box sx={{  }}>
            <InputLabel sx={{
                position: "absolute",
                background: "white",
                fontSize: "8px",
                transform: "translate(6px, -6px)",
                width: "50px",
                textAlign: "center",
                zIndex: 2,
            }}>{label}</InputLabel>
        <Card className={`${className}`} variant="outlined" 
                sx={{cursor: 'pointer', backgroundColor: 'rgba(255, 160, 122, 0.07)', '&:hover': { transform: "translate(0px, 1px)",  boxShadow: "0 0 3px rgba(33,33,33,.2)"}}} 
                onClick={()=>{ 
                    if (trigger.chartRef) {
                        dispatch(dfActions.setFocusedChart(trigger.chartRef));
                        dispatch(dfActions.setFocusedTable((charts.find(c => c.id == trigger.chartRef) as Chart).tableRef));
                    }
                }}>
            <Stack direction="row" sx={{marginLeft: 1, marginRight: 'auto', fontSize: 12}} alignItems="center" gap={"2px"}>
                <PrecisionManufacturing  sx={{color: 'darkgray', width: '14px', height: '14px'}} />
                <Box sx={{margin: '4px 8px 4px 2px', flex: 1}}>
                    {hideFields ? "" : <Typography fontSize="inherit" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                                    color: 'rgba(0,0,0,0.7)', maxWidth: 'calc(100%)'}}>{encodingComp}</Typography>}
                    <Typography fontSize="inherit" sx={{textAlign: 'center', 
                                    color: 'rgba(0,0,0,0.7)',  maxWidth: 'calc(100%)'}}>{prompt}</Typography> 
                </Box>
            </Stack>
        </Card>
    </Box>
}

export const MiniTriggerCard: FC<{className?: string, trigger: Trigger, hideFields?: boolean, label?: string}> = function ({ label, className, trigger, hideFields }) {

    const charts = useSelector((state: DataFormulatorState) => state.charts);
    let fieldItems = useSelector((state: DataFormulatorState) => state.conceptShelfItems);
    const focusedChartId = useSelector((state: DataFormulatorState) => state.focusedChartId);

    const dispatch = useDispatch<AppDispatch>();

    let encodingComp : any = ''
    let prompt = trigger.instruction ? `"${trigger.instruction}"` : "";

    // console.log(trigger)

    if (trigger.chartRef && charts.find(c => c.id == trigger.chartRef)) {

        // console.log('chartRef')
        // console.log(trigger.chartRef)

        let chart = charts.find(c => c.id == trigger.chartRef) as Chart;
        let encodingMap = chart?.encodingMap;

        encodingComp = Object.entries(encodingMap)
            .filter(([channel, encoding]) => {
                return encoding.fieldID != undefined;
            })
            .map(([channel, encoding], index) => {
                let field = fieldItems.find(f => f.id == encoding.fieldID) as FieldItem;
                return [index > 0 ? '⨉' : '', 
                        <Chip sx={{color:'inherit', maxWidth: '110px', marginLeft: "2px", height: 16, fontSize: 'inherit', borderRadius: '4px', 
                                   border: '1px solid rgb(250 235 215)', background: 'rgb(250 235 215 / 70%)',
                                   '& .MuiChip-label': { paddingLeft: '6px', paddingRight: '6px' }}} 
                              label={`${field.name}`} />]
            })
    }

    return <Box sx={{  }}>
        <Card className={`${className}`} variant="outlined" 
                sx={{textTransform: "none",  backgroundColor: 'rgba(255, 160, 122, 0.07)' }} 
              >
            <Stack direction="row" sx={{ marginRight: 'auto', fontSize: 11}} alignItems="center" gap={"2px"}>
                <Box sx={{margin: '4px 2px 4px 2px', flex: 1}}>
                    {hideFields ? "" : <Typography fontSize="inherit" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                                    color: 'rgba(0,0,0,0.7)', maxWidth: 'calc(100%)'}}>{encodingComp}</Typography>}
                    <Typography fontSize="inherit" sx={{textAlign: 'center', 
                                    color: 'rgba(0,0,0,0.7)',  maxWidth: 'calc(100%)'}}>{prompt}</Typography> 
                </Box>
            </Stack>
        </Card>
    </Box>
}

export const EncodingShelfCard: FC<EncodingShelfCardProps> = function ({ chartId, trigger }) {

    // reference to states
    const tables = useSelector((state: DataFormulatorState) => state.tables);
    const charts = useSelector((state: DataFormulatorState) => state.charts);
    const betaMode = useSelector((state: DataFormulatorState) => state.betaMode);
    const chartSynthesisInProgress = useSelector((state: DataFormulatorState) => state.chartSynthesisInProgress);
    let activeModel = useSelector(dfSelectors.getActiveModel);

    let synthesisRunning = chartSynthesisInProgress.includes(chartId)

    let [prompt, setPrompt] = useState<string>(trigger?.instruction || "");
    let [promptBoxOpen, setPromptBoxOpen] = useState<boolean>(true);

    let [fieldComponentsOpen, setFieldComponentsOpen] = useState<boolean>(false);

    let chart = charts.find(chart => chart.id == chartId) as Chart;
    let encodingMap = chart?.encodingMap;

    let handleUpdateChartType = (newChartType: string)=>{
        dispatch(dfActions.updateChartType({chartId, chartType: newChartType}));
    }

    // let handleSetSynthesisStatus = (status: boolean) => {
    //     dispatch(dfActions.changeChartRunningStatus({chartId, status}))
    // }

    const conceptShelfItems = useSelector((state: DataFormulatorState) => state.conceptShelfItems);

    let currentTable = getDataTable(chart, tables, charts, conceptShelfItems);

    const dispatch = useDispatch<AppDispatch>();

    let encodingBoxGroups = Object.entries(ChannelGroups)
        .filter(([group, channelList]) => channelList.some(ch => Object.keys(encodingMap).includes(ch)))
        .map(([group, channelList]) => {

            let component = <Box>
                <Typography key={`encoding-group-${group}`} sx={{ fontSize: 10, color: "darkgray", marginTop: "6px", marginBottom: "2px" }}>{group}</Typography>
                {channelList.filter(channel => Object.keys(encodingMap).includes(channel))
                    .map(channel => <EncodingBox key={`shelf-${channel}`} channel={channel as Channel} chartId={chartId} />)}
            </Box>

            return component;
        });

    let activeFields = conceptShelfItems.filter((field) => Array.from(Object.values(encodingMap))
                                        .map((enc: EncodingItem) => enc.fieldID).includes(field.id));
    let activeBaseFields = conceptShelfItems.filter((field) => {
        return activeFields.map(f => f.source == "derived" ? (f.transform as ConceptTransformation).parentIDs : [f.id]).flat().includes(field.id);
    });
    let activeCustomFields = activeBaseFields.filter(field => field.source == "custom");


    // check if the current table contains all fields already exists a table that fullfills the user's specification
    let existsWorkingTable = activeBaseFields.length == 0 || activeBaseFields.every(f => currentTable.names.includes(f.name));

    let deriveNewData = (overrideTableId?: string) => {

        let mode = 'formulate';
        let baseTables = selectBaseTables(activeFields, conceptShelfItems, tables);

        if (baseTables.length == 0) {
            return;
        }

        if (currentTable.derive == undefined && prompt == "" && activeCustomFields.length == 0 && 
                tables.some(t => t.derive == undefined && activeBaseFields.every(f => t.names.includes(f.name)))) {

            // if there is no additional fields, directly generate
            let tempTable = getDataTable(chart, tables, charts, conceptShelfItems, true);
            dispatch(dfActions.updateTableRef({chartId: chartId, tableRef: tempTable.id}))

            //dispatch(dfActions.resetDerivedTables([])); //([{code: "", data: inputData.rows}]));
            dispatch(dfActions.changeChartRunningStatus({chartId, status: true}));
            // a fake function to give the feel that synthesizer is running
            setTimeout(function(){
                dispatch(dfActions.changeChartRunningStatus({chartId, status: false}));
                dispatch(dfActions.clearUnReferencedTables());
            }, 400);
            dispatch(dfActions.setVisPaneSize(640));
            return
        }

        dispatch(dfActions.clearUnReferencedTables());
        dispatch(dfActions.setVisPaneSize(640));
        //handleRunSynthesisStream(example);

        let fieldNamesStr = activeFields.map(f => f.name).reduce(
            (a: string, b: string, i, array) => a + (i == 0 ? "" : (i < array.length - 1 ? ', ' : ' and ')) + b, "")

        let token = String(Date.now());

        // if nothing is specified, just a formulation from the beginning
        let messageBody = JSON.stringify({
            token: token,
            mode,
            input_tables: baseTables.map(t => {return { name: t.id.replace(/\.[^/.]+$/ , ""), rows: t.rows }}),
            new_fields: activeBaseFields.map(f => { return {name: f.name} }),
            extra_prompt: prompt,
            model: activeModel
        }) 
        let engine = betaMode ? getUrls().SERVER_DERIVE_DATA_V2_URL : getUrls().SERVER_DERIVE_DATA_URL;

        // console.log("current log")
        // console.log(currentTable.derive?.dialog)

        if (mode == "formulate" && currentTable.derive?.dialog) {
            messageBody = JSON.stringify({
                token: token,
                mode,
                input_tables: baseTables.map(t => {return { name: t.id.replace(/\.[^/.]+$/ , ""), rows: t.rows }}),
                output_fields: activeBaseFields.map(f => { return {name: f.name} }),
                dialog: currentTable.derive?.dialog,
                new_instruction: prompt,
                model: activeModel
            })
            engine = getUrls().SERVER_REFINE_DATA_URL;
        }

        // console.log("--> let's check message body")
        // console.log(messageBody);
        // console.log(engine)

        let message = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: messageBody,
        };

        dispatch(dfActions.changeChartRunningStatus({chartId, status: true}));

        // timeout the request after 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
    
        fetch(engine, {...message, signal: controller.signal })
            .then((response) => response.json())
            .then((data) => {
                
                dispatch(dfActions.changeChartRunningStatus({chartId, status: false}))
                console.log(data);
                console.log(token);
                if (data["status"] == "ok") {
                    if (data["token"] == token) {
                        let candidates = data["results"].filter((item: any) => {
                            return item["content"].length > 0 
                        });
                        if (candidates.length == 0) {
                            dispatch(dfActions.addMessages({
                                "timestamp": Date.now(),
                                "type": "error",
                                "value": "Unable to find a data transformation for the chart, please check concepts, encodings and clarification questions."
                            }));
                        } else {

                            // PART 1: handle triggers
                            let genTableId = () => {
                                let tableSuffix = Number.parseInt((Date.now() - Math.floor(Math.random() * 10000)).toString().slice(-2));
                                let tableId = `table-${tableSuffix}`
                                while (tables.find(t => t.id == tableId) != undefined) {
                                    tableSuffix = tableSuffix + 1;
                                    tableId = `table-${tableSuffix}`
                                } 
                                return tableId;
                            }

                            let candidateTableId = overrideTableId || genTableId();

                            // add the intermediate chart that will be referred by triggers

                            let triggerChartSpec = duplicateChart(chart);
                            let currentTrigger: Trigger =  { 
                                tableId: currentTable.id, 
                                instruction: prompt, 
                                chartRef: triggerChartSpec.id,
                                resultTableId: candidateTableId
                            }

                            triggerChartSpec['intermediate'] = currentTrigger;
                            dispatch(dfActions.addChart(triggerChartSpec));
                        
                            // PART 2: create new table (or override table)
                            let candidate = candidates[0];

                            console.log("-_-:")
                            console.log(candidate)

                            let candidateTable = createDictTable(
                                candidateTableId, 
                                candidate["content"], 
                                { code: candidate["code"], 
                                    codeExpl: candidate["codeExpl"],
                                    source: baseTables.map(t => t.id), 
                                    dialog: candidate["dialog"], 
                                    trigger: currentTrigger }
                            )

                            if (overrideTableId) {
                                dispatch(dfActions.overrideDerivedTables(candidateTable));
                            } else {
                                dispatch(dfActions.insertDerivedTables(candidateTable));
                            }
                            let names = candidateTable.names;
                            let missingNames = names.filter(name => !conceptShelfItems.some(field => field.name == name));
                
                            let conceptsToAdd = missingNames.map((name) => {
                                return {
                                    id: `concept-${name}-${Date.now()}`, name: name, type: "auto" as Type, 
                                    description: "", source: "custom", temporary: true, domain: [],
                                } as FieldItem
                            })
                            dispatch(dfActions.addConceptItems(conceptsToAdd));

                            dispatch(fetchFieldSemanticType(candidateTable));

                            // concepts from the current table
                            let currentConcepts = [...conceptShelfItems.filter(c => names.includes(c.name)), ...conceptsToAdd];

                            // PART 3: create new charts if necessary
                            let needToCreateNewChart = true;
                            
                            // different override strategy -- only override if there exists a chart that share the exact same encoding fields as the planned new chart.
                            if (chart.chartType != "Auto" &&  overrideTableId != undefined && charts.find(c => c.tableRef == overrideTableId)) {
                                let chartToOverride = [...charts.filter(c => c.intermediate == undefined), ...charts].find(c => c.tableRef == overrideTableId) as Chart
                                if (Object.values(chartToOverride.encodingMap)
                                        .map(enc => enc.fieldID)
                                        .filter(fid => fid != undefined &&  conceptShelfItems.find(f => f.id == fid) != undefined)
                                        .map(fid => conceptShelfItems.find(f => f.id == fid) as FieldItem)
                                        .every(f => candidateTable.names.includes(f.name)))
                                    {
                                        // find the chart to set as focus
                                        let cId = [...charts.filter(c => c.intermediate == undefined), ...charts].find(c => c.tableRef == overrideTableId)?.id;
                                        dispatch(dfActions.setFocusedChart(cId));
                                        needToCreateNewChart = false;
                                    }
                            }
                            
                            if (needToCreateNewChart) {
                                let refinedGoal = candidate['refined_goal']

                                let newChart : Chart; 
                                if (chart.chartType == "Auto") {
                                    let chartTypeMap : any = {
                                        "line" : "Line Chart",
                                        "bar": "Bar Chart",
                                        "point": "Scatter Plot",
                                        "boxplot": "Boxplot"
                                    }
                                    let chartType = chartTypeMap[refinedGoal['chart_type']] || 'Scatter Plot';
                                    newChart = generateFreshChart(candidateTable.id, chartType) as Chart;
                                } else if (chart.chartType == "Table") {
                                    newChart = generateFreshChart(candidateTable.id, 'Table')
                                } else {
                                    newChart = JSON.parse(JSON.stringify(chart)) as Chart;
                                    newChart.id = `chart-${Date.now()- Math.floor(Math.random() * 10000)}`;
                                    newChart.saved = false;
                                    newChart.tableRef = candidateTable.id;
                                    newChart.intermediate = undefined;
                                }
                                
                                newChart = resolveChartFields(newChart, currentConcepts, refinedGoal)

                                dispatch(dfActions.addChart(newChart));
                                dispatch(dfActions.setFocusedChart(newChart.id));                                
                            }

                            // PART 4: clean up
                            if (chart.chartType == "Table" || chart.chartType == "Auto" || (existsWorkingTable == false && !chart.intermediate)) {
                                dispatch(dfActions.deleteChartById(chartId));
                            }
                            dispatch(dfActions.clearUnReferencedTables());
                            dispatch(dfActions.clearUnReferencedCustomConcepts());
                            dispatch(dfActions.setFocusedTable(candidateTable.id));

                            dispatch(dfActions.addMessages({
                                "timestamp": Date.now(),
                                "type": "success",
                                "value": `Data formulation for ${fieldNamesStr} complete, found ${candidates.length} candidates.`
                            }));
                        }
                    }
                } else {
                    // TODO: add warnings to show the user
                    dispatch(dfActions.addMessages({
                        "timestamp": Date.now(),
                        "type": "error",
                        "value": "unable to perform data formulation."
                    }));
                }
            }).catch((error) => {
                
                dispatch(dfActions.changeChartRunningStatus({chartId, status: false}));
                dispatch(dfActions.addMessages({
                    "timestamp": Date.now(),
                    "type": "error",
                    "value": `Data formulation for ${fieldNamesStr} fails, maybe try something differently?`
                }));
            });
    }
    let defaultInstruction = chart.chartType == "Auto" ? "" : "" // `the output data should contain fields ${activeBaseFields.map(f => `${f.name}`).join(', ')}`

    //let createDisabled = !existsWorkingTable && (baseTables.length == 0 || Array.from(Object.values(encodingMap)).filter(encoding => { return encoding.fieldID != null }).length == 0);
    let createDisabled = false; //!existsWorkingTable;

    // let synthesisButton = synthesisRunning ?
    //     <Button sx={{ marginLeft: "0", marginTop: 1 }} variant={"outlined"} endIcon={<CircularProgress size={20} />}
    //         color={"primary"} onClick={() => { deriveNewData("rerun") }}>
    //         Formulating...
    //     </Button>
    //     : (currentTable.derive ?
    //         [
    //             <ButtonGroup sx={{marginTop: 1}} color={"warning"} fullWidth disabled={createDisabled}>
    //                 {/* <Tooltip title="change refinement mode">
    //                     <Button size="small" sx={{width: 8}} onClick={() => {setRefineMode(refineMode == "data" ? "chart" : "data")}}>{refineMode == "data" ? <BackupTableIcon /> : <AutoGraphIcon />}</Button>
    //                 </Tooltip> */}
    //                 <Tooltip title={`Run formulate instructions on top of the current result`}>
    //                     <Button sx={{ marginLeft: "0"}}  variant={"contained"} endIcon={<AirlineStopsIcon />}
    //                         disabled={createDisabled} disableElevation color={"primary"} onClick={() => { deriveNewData("formulate") }}>
    //                         Formulate Ontop
    //                     </Button>
    //                 </Tooltip>
    //             </ButtonGroup>,
    //             // <Tooltip title={`Rerun the last formulation step`}>
    //             //     <Button sx={{ marginLeft: "0", marginTop: 1 }}  variant={"contained"} endIcon={<RefreshIcon />}
    //             //         disabled={createDisabled} disableElevation color="warning" onClick={() => { deriveNewData("generate") }}>
    //             //         Re-formulate
    //             //     </Button>
    //             // </Tooltip>
    //         ]
    //         // <Button sx={{ marginLeft: "0" }} variant={"contained"} endIcon={<RefreshIcon />}
    //         //     disabled={createDisabled} disableElevation color={"primary"} onClick={() => { deriveNewData() }}>
    //         //     RE-Formulate
    //         // </Button>
    //         : <Button sx={{ marginLeft: "0", marginTop: 1 }} variant={"contained"}
    //             disabled={createDisabled} color={"primary"} onClick={() => { deriveNewData("formulate") }}>
    //             Formulate
    //         </Button>
    //     )

    // let controllButtons = 
    //     <Box key='control-bottons' sx={{marginLeft: 'auto', display: 'flex'}} >
    //         {/* <Tooltip title="change refinement mode">
    //             <Button size="small" sx={{width: 8}} onClick={() => {setRefineMode(refineMode == "data" ? "chart" : "data")}}>{refineMode == "data" ? <BackupTableIcon /> : <AutoGraphIcon />}</Button>
    //         </Tooltip> */}
    //         <Tooltip key='fork-new-thread' title={`Fork a new thread from this`}>
    //             <IconButton //sx={{ marginLeft: "0"}}  
    //                 disabled={createDisabled}  color={"primary"} onClick={() => { 
    //                     let newChart = JSON.parse(JSON.stringify(chart)) as Chart;
    //                     newChart.id = `chart-${Date.now()- Math.floor(Math.random() * 10000)}`;
    //                     newChart.saved = false;

    //                     console.log('-- about to fork new thread --')
    //                     let refTable : DictTable = getDataTable(newChart, tables, charts, conceptShelfItems);
    //                     console.log(refTable)

    //                     if (refTable.derive) {
    //                         // if the currentTable 
    //                         // create a new fresh table out of it
    //                         let tableSuffix = Number.parseInt((Date.now() - Math.floor(Math.random() * 10000)).toString().slice(-2));
    //                         let tableId = `table-${tableSuffix}`
    //                         while (tables.find(t => t.id == tableId) != undefined) {
    //                             tableSuffix = tableSuffix + 1;
    //                             tableId = `table-${tableSuffix}`
    //                         } 
                            
    //                         let newTable = JSON.parse(JSON.stringify(refTable)) as DictTable
    //                         newTable.id = tableId;
    //                         newTable.derive = undefined;

    //                         newChart.tableRef = newTable.id;
    //                         dispatch(dfActions.addTable(newTable));
    //                         dispatch(fetchFieldSemanticType(newTable));
    //                     }

    //                     dispatch(dfActions.addChart(newChart));
    //                     dispatch(dfActions.setFocusedChart(newChart.id));
    //                 }}>
    //                 <ForkLeftIcon sx={{transform: 'rotate(180deg)'}} fontSize="small" />
    //             </IconButton>
    //         </Tooltip>
    //         <Tooltip key='duplicate-chart' title={`Duplicate the chart`}>
    //             <IconButton sx={{ marginLeft: "-8px"}}
    //                 disabled={createDisabled}  color={"primary"} onClick={() => {
    //                     let newChart = JSON.parse(JSON.stringify(chart)) as Chart;
    //                     newChart.id = `chart-${Date.now()- Math.floor(Math.random() * 10000)}`;
    //                     newChart.saved = false;
    //                     dispatch(dfActions.addChart(newChart));
    //                     dispatch(dfActions.setFocusedChart(newChart.id));
    //                 }}>
    //                 <ContentCopyIcon fontSize="small" />
    //             </IconButton>
    //         </Tooltip>
    //         <Divider key="dv" flexItem orientation="vertical" variant="middle" />
    //         <Tooltip key='rerun-btn' title={`Rerun the last data formulation step`}>
    //             <IconButton 
    //                 disabled={currentTable.derive == undefined}  color="warning" onClick={() => { deriveNewData("rerun") }}>
    //                 <RefreshIcon fontSize="small"/>
    //             </IconButton>
    //         </Tooltip>
    //         <Tooltip key='delete-btn' title={`Delete this chart`}>
    //             <IconButton  sx={{ marginLeft: "-8px"}}
    //                 disabled={createDisabled}  color="warning" onClick={() => { dispatch(dfActions.deleteChartById(chart.id)) }}>
    //                 <DeleteIcon fontSize="small"/>
    //             </IconButton>
    //         </Tooltip>
    //     </Box>

    const w: any = (a: any[], b: any[]) => a.length ? [a[0], ...w(b, a.slice(1))] : b;

    let formulateInputBox = <Box key='text-input-boxes' sx={{display: 'flex', flexDirection: 'row', flex: 1, padding: '0px 4px'}}>
        <TextField
            InputLabelProps={{ shrink: true }}
            id="outlined-multiline-flexible"
            onKeyDown={(event: any) => {
                if (defaultInstruction && (event.key === "Enter" || event.key === "Tab")) {
                    // write your functionality here
                    let target = event.target as HTMLInputElement;
                    if (target.value == "" && target.placeholder != "") {
                        target.value = defaultInstruction;
                        setPrompt(target.value);
                        event.preventDefault();
                    }
                }
            }}
            sx={{
                "& .MuiInputLabel-root": { fontSize: '12px' },
                "& .MuiInput-input": { fontSize: '12px' }
            }}
            onChange={(event) => { setPrompt(event.target.value) }}
            value={prompt}
            label=""
            placeholder={chart.chartType == "Auto" ? "describe visualization goal" : "formulate data"}
            fullWidth
            multiline
            variant="standard"
            size="small"
            maxRows={4} 
            minRows={1}
        />
        {chart.intermediate ? 
            <Box sx={{display: 'flex'}}>
                <Tooltip title={<Typography sx={{fontSize: 11}}>formulate and override <TableRowsIcon sx={{fontSize: 10, marginBottom: '-1px'}}/>{chart.intermediate.resultTableId}</Typography>}>
                    <IconButton sx={{ marginLeft: "0"}} size="small"
                        disabled={createDisabled} color={"warning"} onClick={() => { 
                            deriveNewData(chart.intermediate?.resultTableId); 
                        }}>
                        <ChangeCircleOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {/* <Tooltip title={`formulate new`}>
                    <IconButton sx={{ marginLeft: "0"}} size="small"
                    disabled={createDisabled} color={"primary"} onClick={() => { deriveNewData() }}>
                        <PrecisionManufacturing fontSize="small" />
                    </IconButton>
                </Tooltip> */}
            </Box>
         : 
             <Tooltip title={`Formulate`}>
                <IconButton sx={{ marginLeft: "0"}} 
                disabled={createDisabled} color={"primary"} onClick={() => { deriveNewData() }}>
                    <PrecisionManufacturing />
                </IconButton>
            </Tooltip>
        }
    </Box>

    let channelComponent = (
        <Box sx={{ width: "100%", minWidth: "210px", height: '100%', display: "flex", flexDirection: "column" }}>
            <Box key='mark-selector-box' sx={{ flex: '0 0 auto' }}>
                <FormControl sx={{ m: 1, minWidth: 120, width: "100%", margin: "0px 0"}} size="small">
                    <Select
                        variant="standard"
                        labelId="chart-mark-select-label"
                        id="chart-mark-select"
                        value={chart.chartType}
                        label="Visualization Type"
                        renderValue={(value: string) => {
                            const t = getChartTemplate(value);
                            return (
                                <Box>
                                    {/* <InputLabel shrink id="chart-mark-select-label">Visualization Type</InputLabel> */}
                                    <MenuItem sx={{padding: "0px 0px 0px 4px"}}>
                                        <ListItemIcon sx={{minWidth: "24px"}}>
                                            {typeof t?.icon == 'string' ? <img height="24px" width="24px" src={t?.icon} alt="" role="presentation" /> : t?.icon}
                                            </ListItemIcon>
                                        <ListItemText sx={{marginLeft: "2px", whiteSpace: "initial"}} primaryTypographyProps={{fontSize: '12px'}}>{t?.chart}</ListItemText>
                                    </MenuItem>
                                </Box>
                            )
                        }}
                        onChange={(event) => { handleUpdateChartType(event.target.value) }}>
                        {Object.entries(CHART_TEMPLATES).map(([group, templates]) => {
                            return [
                                <ListSubheader sx={{ color: "darkgray", lineHeight: 2, fontSize: 12 }} key={group}>{group}</ListSubheader>,
                                ...templates.map((t, i) => (
                                    <MenuItem sx={{ fontSize: 12, paddingLeft: 3, paddingRight: 3 }} value={t.chart} key={`${group}-${i}`}>
                                        <ListItemIcon>
                                            {typeof t?.icon == 'string' ? <img height="24px" width="24px" src={t?.icon} alt="" role="presentation" /> : t?.icon}
                                        </ListItemIcon>
                                        <ListItemText primaryTypographyProps={{fontSize: '12px'}}>{t.chart}</ListItemText>
                                    </MenuItem>
                                ))
                            ]
                        })}
                    </Select>
                </FormControl>
            </Box>
            <Box key='encoding-groups' sx={{ flex: '1 1 auto' }} style={{ height: "calc(100% - 100px)" }} className="encoding-list">
                {encodingBoxGroups}
            </Box>
            {/* <InputLabel key='input-label' shrink={true} sx={{fontSize: 12, display: 'flex'}}>
                <Typography fontSize="inherit" sx={{margin: 'auto 0'}}>Data Formulation Process</Typography>
                <Button sx={{marginLeft: '4px', textTransform: 'none', padding: 0, fontSize: 12}}
                    //endIcon={<ExpandMoreIcon sx={{transform: promptBoxOpen ? 'rotate(180deg)' : ''}} />} 
                    onClick={() => { setPromptBoxOpen(!promptBoxOpen)}}>
                    {previousInstructions ? (promptBoxOpen ? "(collapse)" : "(expand)") : ""} 
                </Button>
            </InputLabel> */}
            {/* {previousInstructions} */}
            {!existsWorkingTable ? [
                // <InputLabel key='input-label' shrink={true} sx={{fontSize: 12, display: 'flex'}}>
                //     <Typography fontSize="inherit" sx={{margin: 'auto 0'}}>Data Formulation Process</Typography>
                //     <Button sx={{marginLeft: '4px', textTransform: 'none', padding: 0, fontSize: 12}}
                //         //endIcon={<ExpandMoreIcon sx={{transform: promptBoxOpen ? 'rotate(180deg)' : ''}} />} 
                //         onClick={() => { setPromptBoxOpen(!promptBoxOpen)}}>
                //         {previousInstructions ? (promptBoxOpen ? "(collapse)" : "(expand)") : ""} 
                //     </Button>
                // </InputLabel>,
                // formulateInputBox,
                // <ListItem sx={{padding: '2px 0 2px 0'}}>
                //     <ListItemIcon sx={{minWidth: 0, marginRight: '4px', }}>
                //         <SouthIcon sx={{fontSize: "inherit"}} />
                //     </ListItemIcon>
                //     {followupInputBox}
                // </ListItem>,
                formulateInputBox
            ] : formulateInputBox}
            {/* {synthesisButton} */}
            {/* {controllButtons} */}
        </Box>);

    // console.log(JSON.stringify(visSpec));

    const encodingShelfCard = (
        <Card variant='outlined'  key='channel-components' 
            sx={{ padding: 1, display: 'flex', flexDirection: 'row', alignItems: "center", backgroundColor: trigger ? "rgba(255, 160, 122, 0.07)" : "" }}>
            {channelComponent}
        </Card>
    )

    return encodingShelfCard;
}