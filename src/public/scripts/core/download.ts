import { FileOutputs } from './structure';
import JSZip from 'jszip';

export const downloadZip = async (files: FileOutputs, zipFileName: string = 'files.zip') => {
        const zip = new JSZip();

        // Add files to the ZIP
        for (const [key, value] of Object.entries(files)) {
                zip.file(key, value);
        }

        // Generate the ZIP file
        try {
                const content = await zip.generateAsync({ type: 'blob' });

                // Create a download link
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = zipFileName;

                // Append to the body (necessary for Firefox)
                document.body.appendChild(link);

                // Trigger the download
                link.click();

                // Clean up and remove the link
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
        } catch (error) {
                console.error('Error generating ZIP:', error);
        }
};
