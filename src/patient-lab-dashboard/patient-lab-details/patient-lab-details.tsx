import AddFilled16 from '@carbon/icons-react/lib/add/16'
import {ExtensionSlot, usePatient} from '@openmrs/esm-framework'
import {
  Button,
  Column,
  Grid,
  NotificationKind,
  Row,
  ToastNotification,
} from 'carbon-components-react'
import React, {useEffect, useState} from 'react'
import {RouteComponentProps} from 'react-router-dom'
import {
  isAuditLogEnabledKey,
  loggedInUserKey,
  failureMessage,
  successMessage,
} from '../../utils/constants'
import PendingLabOrdersProvider from '../../context/pending-orders-context'
import {UploadReportProvider} from '../../context/upload-report-context'
import Loader from '../../common/loader/loader.component'
import ReportTable from '../table/report-table/report-table.component'
import PendingLabOrdersTable from '../table/pending-lab-orders/pending-lab-orders'
import UploadReport from '../upload-report/upload-report'
import {
  auditLogURL,
  getPayloadForPatientAccess,
  postApiCall,
} from '../../utils/api-utils'
import styles from './patient-lab-details.scss'
interface PatientParamsType {
  patientUuid: string
}

const PatientLabDetails: React.FC<RouteComponentProps<PatientParamsType>> = ({
  match,
}) => {
  const {patientUuid} = match.params
  const {isLoading, patient, error} = usePatient(patientUuid)
  const [onButtonClick, setOnButtonClick] = useState<boolean>(false)
  const [onSaveSuccess, setOnSaveSuccess] = useState<boolean>(false)
  const [onSaveFailure, setOnSaveFailure] = useState<boolean>(false)
  const [reloadReportTable, setReloadReportTable] = useState<boolean>(false)

  const handleClick = () => {
    setOnButtonClick(true)
    setOnSaveSuccess(false)
    setReloadReportTable(false)
    setOnSaveFailure(false)
  }

  const handleClose = () => {
    setOnButtonClick(false)
  }

  const handleUploadAndSave = (isSaveSuccess: boolean) => {
    setOnButtonClick(false)
    setOnSaveSuccess(isSaveSuccess)
    setOnSaveFailure(!isSaveSuccess)
    setReloadReportTable(true)
  }

  const renderNotificationMessage = (
    kind: NotificationKind,
    title: string,
    saveHandler: Function,
  ) => (
    <ToastNotification
      kind={kind}
      lowContrast={true}
      title={title}
      timeout={5000}
      onClose={() => {
        saveHandler(false)
        return true
      }}
    />
  )

  useEffect(() => {
    const loggedInUser = localStorage.getItem(loggedInUserKey)
    const isAuditLogEnabled = localStorage.getItem(isAuditLogEnabledKey)

    if (isAuditLogEnabled && loggedInUser && patient) {
      const patientIdentifier = patient?.identifier?.filter(
        identifier => identifier.type.text == 'Patient Identifier',
      )[0]
      const ac = new AbortController()
      const auditMessagePayload = getPayloadForPatientAccess(
        loggedInUser,
        patientUuid,
        patientIdentifier?.value,
      )
      postApiCall(auditLogURL, auditMessagePayload, ac)
    }
  }, [patient])

  return (
    <main
      className={
        onButtonClick
          ? styles.patientDetailsContainerWithSidePanel
          : styles.patientDetailsContainer
      }
    >
      {isLoading ? (
        <Loader />
      ) : error ? (
        <div>Something went wrong: {error.message}</div>
      ) : (
        <div>
          <div>
            <Grid style={{paddingLeft: '0'}}>
              <Row>
                <Column lg={9}>
                  <ExtensionSlot
                    extensionSlotName="patient-header-slot"
                    state={{
                      patient,
                      patientUuid: patient.id,
                      hideActionsOverflow: true,
                    }}
                  />
                </Column>
                <Column lg={3}>
                  {onSaveSuccess &&
                    renderNotificationMessage(
                      'success',
                      successMessage,
                      setOnSaveSuccess,
                    )}
                  {onSaveFailure &&
                    renderNotificationMessage(
                      'error',
                      failureMessage,
                      setOnSaveFailure,
                    )}
                </Column>
              </Row>
            </Grid>
          </div>
          <br></br>
          <br></br>
          <PendingLabOrdersProvider>
            <PendingLabOrdersTable
              patientUuid={patientUuid}
              onButtonClick={onButtonClick}
              reloadTableData={reloadReportTable}
            />
            <br></br>
            <br></br>
            <Button renderIcon={AddFilled16} onClick={handleClick}>
              Upload Report
            </Button>
            {onButtonClick && (
              <UploadReportProvider>
                <UploadReport
                  saveHandler={(isSaveSuccess = false) =>
                    handleUploadAndSave(isSaveSuccess)
                  }
                  closeHandler={() => handleClose()}
                  header="Upload Report"
                  patientUuid={patientUuid}
                />
              </UploadReportProvider>
            )}
            <br></br>
            <br></br>
          </PendingLabOrdersProvider>
          <ReportTable
            patientUuid={patientUuid}
            reloadTableData={reloadReportTable}
          />
          <br></br>
          <br></br>
        </div>
      )}
    </main>
  )
}

export default PatientLabDetails