import UploadIcon from '@/icons/UploadIcon'
import Button from './Button'

function FileUpload() {
  return (
    <div className="file-upload p-15 border rounded-md border-dashed text-center text-lg">
      <div className="max-w-100 mx-auto flex flex-col gap-3">
        <UploadIcon className="mx-auto mb-3" />
        <p className="font-medium">Drag and drop document</p>
        <small className="text-muted text-normal">
          Supported file types: SCV, Email, Excel, PDF, PowerPoint, RTF, Text, Word, Zip
        </small>
        <div className="mt-5">
          <Button size="medium">Choose File</Button>
        </div>
      </div>
    </div>
  )
}

export default FileUpload
