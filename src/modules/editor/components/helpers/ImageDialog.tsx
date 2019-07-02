import * as React from "react";

import { client } from "../../../apolloClient";
import { queryAccountIDs } from "../../queryHelpers";
import gql from "graphql-tag";

const CREATE_MEDIUM = gql`
mutation CreateMedium($title: String!, $article_id: Int!, $user_id: Int!, $caption: String!, $attachment_b64: String!, $media_type: String!) {
    createMedium(
        title: $title,
        article_id: $article_id,
        user_id: $user_id,
        caption: $caption,
        attachment_b64: $attachment_b64,
        media_type: $media_type
    ) {
        id
    }
}
`

interface IVariables {
    title: string,
    article_id: number, 
    user_id: number, 
    caption?: string, 
    attachment_b64: string, 
    media_type: string
}

interface IData {
    id: string
}

import { Dialog, DialogActions, DialogButton, DialogTitle, SimpleDialog, DialogContent } from '@rmwc/dialog';
import { TextField } from '@rmwc/textfield';
import { Select } from "@rmwc/select";
import { Button } from '@rmwc/button';

import { ContributorsField } from './ContributorsField';

interface IImageDialogProps {
    articleId: string
    open: boolean,
    onClose: () => any
}

export const ImageDialog: React.FunctionComponent<IImageDialogProps> = ({ articleId, open, onClose }) => {
    const [title, setTitle] = React.useState("");
    const [caption, setCaption] = React.useState("");
    const [contributors, setContributors] = React.useState<string[]>([]);
    const [imageType, setImageType] = React.useState("");
    const [file, setFile] = React.useState("");
    const [dataURL, setDataURL] = React.useState("");

    const reader = new FileReader();
    reader.onloadend = (e) => {setDataURL(reader.result as string)}

    const handleClose = (e: string) => {
        switch(e) {
            case "cancel":
                setTitle("");
                setCaption("");
                setFile("");
                setDataURL("");
                break;
            case "accept":
                queryAccountIDs(contributors, client).then(results => {
                    console.log(`[${results.join(", ")}]`)
                    client.mutate<IData, IVariables>({
                        mutation: CREATE_MEDIUM,
                        variables: {
                            title,
                            caption,
                            article_id: parseInt(articleId),
                            user_id: results ? results[0] : -1,
                            attachment_b64: dataURL,
                            media_type: imageType
                        }
                    }).then(e => {
                        if(e.data) alert(`Successfully uploaded medium # ${e.data.id}`)
                        else alert(`Failed to upload with errors: ${e.errors}`);
                    })
                })
                break;
        }
        onClose();
    } 

    return (
        <Dialog
            open={open}
            onClose={e => {handleClose(e.detail.action || "")}}
            preventOutsideDismiss={true}
        >
            <DialogTitle>Upload Image</DialogTitle>
            <DialogContent>
                <form style={{display: "flex", flexDirection: "column"}}>
                    <TextField label="Title" required={true} value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
                    <TextField label="Caption" value={caption} onChange={(e) => setCaption(e.currentTarget.value)} />
                    <Select 
                        label="Type"  
                        enhanced={true} 
                        value={imageType} 
                        onChange={e => setImageType(e.currentTarget.value)} 
                        options={[{label: "Photo", value: "photo"}, {label: "Art", value: "illustration"}]}
                    />
                    <ContributorsField value={contributors} onChange={contributors => setContributors(contributors)} />
                    <input 
                        type="file" 
                        accept=".jpg, .jpeg, .png"
                        required={true}
                        value={file} 
                        onChange={e => {
                            setFile(e.currentTarget.value); 
                            if(e.target.files && e.target.files.length > 0) {
                                reader.readAsDataURL(e.target.files![0])
                            }
                            else setDataURL("");
                        }} 
                    />
                    {
                        dataURL ? <img src={dataURL} height={200}/> : undefined
                    }
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {handleClose("cancel")}}>Cancel</Button>
                <Button action="accept" onClick={() => {handleClose("cancel")}}>Upload</Button>
            </DialogActions>
        </Dialog>
    )
}