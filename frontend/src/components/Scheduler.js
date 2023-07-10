//With the link you can redirect the page to a new page without refreshing the whole page but only the section where you want the page to appear. If you don't use Link and use a regular <a> tag, when the user clicks on it, it will refresh the whole page to show the page on the link, which is not user friendly.
//import { Link } from 'react-router-dom'
//import { KUARSIS_PUBLIC_BUCKET_URL } from '../constants/enviromentConstants'
import {Inject, ScheduleComponent, Day, DragAndDrop, Resize, ViewsDirective, ViewDirective} from '@syncfusion/ej2-react-schedule';
import {LogThis, initLogSettings} from '../libs/Logger'
import { v4 as uuidv4 } from 'uuid';
 
import React, { useEffect, useState} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Message from './Message'
import Loader from './Loader'  
import { getScheduleDetails, updateScheduleDetails} from '../actions/schedulerActions'
//import {SCHEDULE_DETAILS_SUCCESS} from '../constants/schedulerConstants'

const logSettings=initLogSettings('Scheduler')

const Scheduler = ({providerId, product}) => {

  logSettings.functionName = 'Scheduler'
  LogThis(logSettings, `Entering to the Scheduler: providerId=${providerId}`)

  const dispatch = useDispatch() 
  
  const schedulerDetails = useSelector((state) => state.schedulerDetails)
  const { loading, error, schedule } = schedulerDetails
  //const {isOverlapped = useRef(false)
  
  const [isOverlapped, setisOverlapped] = useState(false)

  const [isEnoughNoticeInAdvanced, setisEnoughNoticeInAdvanced] = useState(true)
  
 
   const onActionBegin = (args) => { 
    logSettings.sourceFunction='onActionBegin'
    setisOverlapped(false)
    if (args.requestType === 'toolbarItemRendering') {
    // This block is execute before toolbarItem render
    }
    if (args.requestType === 'dateNavigate') {
    // This block is executed before previous and next navigation
    }
    if (args.requestType === 'viewNavigate') {
    // This block is execute before view navigation
    }
    if (args.requestType === 'eventCreate') {
    // This block is execute before an appointment create
     LogThis(logSettings, `eventCreate: Entering, args=${JSON.stringify(args)}`)
    //if(args.changedRecords.length > 0) {
      let scheduler = document.getElementById('scheduler').ej2_instances[0]
      let appointments = scheduler.getEvents()
      //let newSchedule = [...scheduler]
      LogThis(logSettings, `eventChange: appointments=${JSON.stringify(appointments)}`)
      const _isAppointmentOveralapped = IsSlotAvailable(args.addedRecords[0], appointments)
      setisOverlapped(_isAppointmentOveralapped)
      
      const _isEnoughNoticeInAdvanced = IsEnoughNoticeInAdvanced(args.addedRecords[0])
      setisEnoughNoticeInAdvanced(_isEnoughNoticeInAdvanced)

      if(_isAppointmentOveralapped || !_isEnoughNoticeInAdvanced){
        //alert('Appointments overlapped')
        args.cancel = true
      } else { 
        args.data[0].schedulerEventId = uuidv4() 
      }
    }  
    if (args.requestType === 'eventChange') {
      // This block is execute before an appointment change
      LogThis(logSettings, `eventChange: Entering, args=${JSON.stringify(args)}`)

      let scheduler = document.getElementById('scheduler').ej2_instances[0]
      let appointments = scheduler.getEvents()

      LogThis(logSettings, `eventChange: appointments=${JSON.stringify(appointments)}`)
      const _isAppointmentOveralapped = IsSlotAvailable(args.changedRecords[0], appointments)
      setisOverlapped(_isAppointmentOveralapped)
      const _isEnoughNoticeInAdvanced = IsEnoughNoticeInAdvanced(args.changedRecords[0])
      setisEnoughNoticeInAdvanced(_isEnoughNoticeInAdvanced)

      if(_isAppointmentOveralapped || !_isEnoughNoticeInAdvanced){
        args.cancel = true
      }
    }
    if (args.requestType === 'eventRemove') {
    // This block is execute before an appointment remove
    }
} 
      
const IsSlotAvailable = (newEvent, eventList) => {
  logSettings.sourceFunction = 'IsSlotAvailable'
  let isOverlapped = 0
  let newEventList = eventList.filter(e => e.schedulerEventId!==newEvent.schedulerEventId)
  newEventList.some(eventAlreadyScheduled => {
    if (   (newEvent.StartTime >= eventAlreadyScheduled.StartTime && newEvent.StartTime < eventAlreadyScheduled.EndTime)
        || (newEvent.EndTime > eventAlreadyScheduled.StartTime && newEvent.EndTime <= eventAlreadyScheduled.EndTime)
        || ( newEvent.StartTime===eventAlreadyScheduled.StartTime && newEvent.EndTime === eventAlreadyScheduled.EndTime)
        || ( newEvent.StartTime<eventAlreadyScheduled.StartTime && newEvent.EndTime > eventAlreadyScheduled.EndTime)
        ) {
          LogThis(logSettings, `overlap identified`)
          isOverlapped=true
          return true;
        }
  })

  if(isOverlapped)
  { 
    LogThis(logSettings, `event is overlapped: true`)
    return true;
  }
  LogThis(logSettings, `event is overlapped: false`)  
  return false;  
}

const IsEnoughNoticeInAdvanced = (newEvent) => {
  const currentTime = new Date()
  const currentTimePlusHours = new Date(currentTime.getTime() + (2*60*60*1000)) 
  const eventStartTime = new Date()
  if(newEvent.StartTime >= currentTimePlusHours){
    return true;
  }
  return false;
}

   const onActionComplete = (args) => {   
     
    logSettings.sourceFunction='onActionComplete'
    LogThis(logSettings, ` args.requestType = ${JSON.stringify(args.requestType)}; args.data = ${JSON.stringify(args.data)}`)

    if (args.requestType === 'eventCreated' /*|| args.requestType === 'eventChanged' || args.requestType === 'eventRemoved'*/) { 
        // This block is execute after an appointment create
        LogThis(logSettings, `eventCreated: Entering`)
        let scheduler = document.getElementById('scheduler').ej2_instances[0]
        let appointments = scheduler.getEvents()
        //let blockedTimes = scheduler.getBlockEvents()
        //const wholeSchedule = appointments.concat(blockedTimes).concat(args.data)
        //const wholeSchedule = appointments
        // const newAppointment = [...args.data]
        // newAppointment.schedulerEventId = Guid()
        appointments = appointments.concat(args.data)
         
        //LogThis(logSettings, `eventCreated wholeSchedule=${JSON.stringify(wholeSchedule)}`)
        LogThis(logSettings, `eventCreated appointments=${JSON.stringify(appointments)}`)
        //setcalendarSchedule({dataSource: wholeSchedule})
        const newSchedule = schedule 
        //LogThis(logSettings, `2 newSchedule=${newSchedule}`) 
        newSchedule.scheduleData=appointments
        dispatch(updateScheduleDetails(newSchedule, product))
    }  
    if (args.requestType === 'eventChanged') { 
        // This block is execute after an appointment change
        LogThis(logSettings, `eventChanged: Entering`)
        let scheduler = document.getElementById('scheduler').ej2_instances[0]
        let appointments = scheduler.getEvents()
        //let blockedTimes = scheduler.getBlockEvents()
        LogThis(logSettings, `eventChanged: Before updating Appointments index: appointments=${JSON.stringify(appointments)} args.data=${JSON.stringify(args.data)}`)
   
        const newAppointments = appointments.filter(appt => (args.data.find( dt => appt.Guid===dt.Guid)?false:true))
        
        LogThis(logSettings, `eventChanged: After updating Appointments: newAppointments=${JSON.stringify(newAppointments)}`)
 
        const wholeSchedule = newAppointments.concat(args.data)
        
        LogThis(logSettings, `eventChanged wholeSchedue=${JSON.stringify(wholeSchedule)}`)
        //setcalendarSchedule({dataSource: wholeSchedule})
        const newSchedule = schedule
        //LogThis(logSettings, `2 newSchedule=${newSchedule}`)
        newSchedule.scheduleData=wholeSchedule
        dispatch(updateScheduleDetails(newSchedule, product))
    } 
    if(args.requestType === 'eventRemoved') {  
        // This block is execute after an appointment remove
        // This block is execute after an appointment change
        let scheduler = document.getElementById('scheduler').ej2_instances[0]
        let appointments = scheduler.getEvents()
        //let blockedTimes = scheduler.getBlockEvents()
        LogThis(logSettings, `eventRemoved: Before filtering Appointments: appointments=${JSON.stringify(appointments)} args.data=${JSON.stringify(args.data)}`)
        
        const newAppointments = appointments.filter(appt => (args.data.find( dt => appt.Guid===dt.Guid)?false:true))

        LogThis(logSettings, `eventRemoved: After filtering Appointments: appointments=${JSON.stringify(newAppointments)}`)

        const wholeSchedule = newAppointments
        LogThis(logSettings, `eventRemoved: After contatenating Appointments: wholeSchedule=${JSON.stringify(wholeSchedule)}`)

       //setcalendarSchedule({dataSource: wholeSchedule})
       const newSchedule = schedule

       LogThis(logSettings, `eventRemoved: After updating newSchedule with schedule: newSchedule=${JSON.stringify(newSchedule)}`)
       //LogThis(logSettings, `2 newSchedule=${newSchedule}`)
       newSchedule[0].scheduleData = wholeSchedule
       LogThis(logSettings, `eventRemoved: After updating newSchedule with updated events: newSchedule=${JSON.stringify(newSchedule)}`)
       //console.dir('NEW-SCHEDULE', JSON.stringify(newSchedule))
       dispatch(updateScheduleDetails(newSchedule))
    }
    LogThis(logSettings, `eventCreated event Ended`)
  }

  useEffect(() => { 
    if(providerId){
    dispatch(getScheduleDetails(providerId))
    } 
// eslint-disable-next-line 
  }, [providerId])

  useEffect(() => {  
    logSettings.sourceFunction='useEffect checking schedule'
    LogThis(logSettings, `loading=${JSON.stringify(loading)}; schedule=${JSON.stringify(schedule)}; error=${JSON.stringify(error)};`)
// eslint-disable-next-line  
  }, [loading, schedule, error])
 
    return ( 
        <div className='schedulerClass'>
        {console.log(`Scheduler, Rendering before loadingcheck: loading=${JSON.stringify(loading)}; schedule=${JSON.stringify(schedule)}`)}
        {loading&&(!schedule??true) ? ( 
        <>
        {console.log(`Scheduler, Rendering Loading: loading=${JSON.stringify(loading)}; schedule=${JSON.stringify(schedule)}`)}
        <Loader />
        </>  
      ) : error ? ( 
        <Message variant='danger'>{error}</Message>
      ) : (    
        <>
            {console.log(`Scheduler, Rendering Start: loading=${JSON.stringify(loading)}; schedule.scheduleData=${JSON.stringify(schedule.scheduleData)} `)}
            {isOverlapped && <div className='schedulerAlertMessage'><Message variant='danger'>{'Appoinments are overlapping, please select different date/times.'}</Message> </div> }
            {!isEnoughNoticeInAdvanced && <div className='schedulerAlertMessage'><Message variant='danger'>{'Start Time must be at least 2 hours ahead of current time to give enough notice in advanced to provider.'}</Message> </div> }
            <div style={{display: 'block'}}>
            <ScheduleComponent id='scheduler' currentView='Day' eventSettings={{dataSource:schedule.scheduleData}}  actionBegin={onActionBegin} actionComplete={onActionComplete} > 
            <ViewsDirective>
              <ViewDirective option='Day' interval={7} displayName='7 Days' startHour='8:00' endHour='20:00'></ViewDirective>
            </ViewsDirective>
            <Inject services={[Day, DragAndDrop, Resize]} />
          </ScheduleComponent> 
          </div>
        </>)  
      } 
      {/* {logSettings.sourceFunction='Render: before isInitialLoad.current checks'}
      {LogThis(logSettings, `1 changing isInitialLoad.current=${isInitialLoad.current}`)}
      {isInitialLoad.current=false}
      {LogThis(logSettings, `2 changing isInitialLoad.current=${isInitialLoad.current}`)} */}
    </div>
  )
} 
 
export default Scheduler
