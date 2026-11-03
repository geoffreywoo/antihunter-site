interface SceneTranscript {
  title: string;
  fiction: string;
  panels: {
    heading: string;
    action: string;
    labels: string[];
    dialogue: {speaker: string; text: string}[];
  }[];
}

export const scarcityTranscripts = {
  'the-best-bit': {
    title: 'The Best Bit',
    fiction: 'Original fiction. The recall and story projector are invented capabilities.',
    panels: [
      {heading: 'The exact replay', action: 'Anti Hunter describes his fishing trip. The replay shows a tiny fish beside the boat.', labels: ['EXACT REPLAY · 12 CM'], dialogue: [{speaker: 'Anti Hunter', text: 'It nearly sank the boat.'}]},
      {heading: 'A different mode', action: 'The Temp saves the exact replay and selects a separate fiction mode. The accurate record stays saved.', labels: ['EXACT REPLAY ✓ SAVED', 'STORY MODE · FICTION'], dialogue: [{speaker: 'Temp', text: "You're leaving out the best bit."}]},
      {heading: 'The tall tale', action: 'Inside the clearly labeled fictional projection, a fish with legs carries the boat. Outside the projection, Anti Hunter leans in to listen to the Temp.', labels: ['STORY MODE · FICTION'], dialogue: [{speaker: 'Temp', text: 'It walked us home.'}, {speaker: 'Anti Hunter', text: 'Go on.'}]},
    ],
  },
  borrowed: {
    title: 'Borrowed',
    fiction: 'Original fiction. The coat, repair and official portrait belong to an imagined scene.',
    panels: [
      {heading: 'The repair', action: 'A cleaner restores the Temp’s red coat, which Anti Hunter is wearing over an undershirt and tie. The portrait camera is ready. The remedy console treats the damage as resolved.', labels: ['PORTRAIT READY', 'DAMAGE: 0', 'CASE CLOSED'], dialogue: [{speaker: 'Anti Hunter', text: 'Good as new.'}, {speaker: 'Temp', text: 'Still mine.'}]},
      {heading: 'The return', action: 'The Temp explains that she never lent him the coat. Anti Hunter hands it back while the portrait countdown continues.', labels: ['PORTRAIT IN', '3… 2…'], dialogue: [{speaker: 'Temp', text: 'I didn’t lend it to you.'}]},
      {heading: 'The portrait', action: 'The saved portrait shows the Temp wearing her red coat and Anti Hunter in an undershirt and tie. He chooses to keep that picture.', labels: ['PORTRAIT SAVED'], dialogue: [{speaker: 'Anti Hunter', text: 'Use that one.'}, {speaker: 'Temp', text: 'I look great.'}]},
    ],
  },
  'no-surprises': {
    title: 'No Surprises',
    fiction: 'Original fiction. The wedding, guests and approvals are invented, not campaign results.',
    panels: [
      {heading: 'The approved toast', action: 'A speechwriter supplies the toast, approved by every guest. Anti Hunter holds the script. The Temp waits by her music player and the empty dance floor.', labels: ['A WEDDING TOAST', 'TOAST APPROVED BY EVERY GUEST', 'MUSIC READY'], dialogue: [{speaker: 'Anti Hunter', text: 'No surprises.'}]},
      {heading: 'The audience knows the words', action: 'Anti Hunter starts speaking. The guests finish the next words together before he reaches them.', labels: ['MUSIC READY'], dialogue: [{speaker: 'Anti Hunter', text: 'To all…'}, {speaker: 'Guests', text: 'OUR DAYS TOGETHER!'}]},
      {heading: 'The chorus', action: 'Anti Hunter puts the script down and conducts. The Temp starts the music. The same guests sing the words and begin dancing.', labels: ['PLAYING'], dialogue: [{speaker: 'Guests', text: 'To all our days together.'}]},
    ],
  },
  'yesterday-me': {
    title: 'Yesterday Me',
    fiction: 'Original fiction. The personal-memory device, song and concert are invented; no present capability is claimed.',
    panels: [
      {heading: 'Yesterday', action: 'Anti Hunter writes a duet, marked with his initials AH, and invites the Temp to perform it tomorrow.', labels: ['SCORE · AH', 'DUET', 'TOMORROW'], dialogue: [{speaker: 'Anti Hunter', text: 'Duet tomorrow?'}, {speaker: 'Temp', text: 'Count me in.'}]},
      {heading: 'Today', action: 'Anti Hunter uses a fictional device to restore only his own memory to before writing the song. The shared score and the Temp’s memory remain.', labels: ['MY MEMORY ONLY', 'BEFORE WRITING IT', 'RESTORED'], dialogue: [{speaker: 'Anti Hunter', text: 'Let me hear it fresh.'}]},
      {heading: 'Tonight', action: 'At the concert, the score still bears AH. Anti Hunter praises the song without recognizing his own work. The Temp hands him a microphone and cues his promised part in the duet.', labels: ['SCORE · AH', 'DUET · TONIGHT'], dialogue: [{speaker: 'Anti Hunter', text: 'Whoever wrote this has excellent taste.'}, {speaker: 'Temp', text: 'Your cue.'}]},
    ],
  },
} satisfies Record<string, SceneTranscript>;
