function reformatIntoSimpleTuples(zenResultSetJSON, displayType){
	//displayType and displayRowHeaders are optional
	//	displayType should be "text" or "key" (note, anything other than "text" is treated as "key")
	//
	//  This function creates three global variables; headerTuple rowTuples and repeatMask
	//		headerTuple compresses the (potentially) multi-leveled header into a 
	//			single header line, with the stacked text concatenated into each cell
	//		rowTuples contains each row with the following format: 
	//			[row measure members1, rmm2, ..., rmmN, row dimension members1, rdm2, ..., rdmN, data1, data2, ..., dataN]
	//		repeatMask mirrors rowTuples and contains a CSS class for each data element:
	//			tableRepeatFollower = the cell value is the same as the one directly above.  This class let's us easily 
	//				access all repeated values, such as when we want to hide them.
	//			tableRepeatLeader = the cell value is different than the one above or we are in the 1st data row.
	//			tableData = we have a data cell
	
	//Global Variables
	displayType = typeof displayType !== 'undefined' ? displayType : 'text';
	headerTuple = [];   //The header information that we deliver to the consuming object
	repeatMask = [];    //We'll use this in rendering, to assigne the repeatFollower and repeatLeader CSS class
	rowDimensionTuples = [];
	rowTuples = [];     //The actual data

	var tuples = zenResultSetJSON.tuples;
	var lastTuple = tuples[tuples.length -1];
	var lenDataGridXAxis = lastTuple[1];
	var lenDataGridYAxis = lastTuple[2];
	
	
	//walk through the dimensons/measures.  collect the "column dimensions", measures and row dimensions.
	var colDimensions = [];
	var rowDimensions = [];
	var colMeasures = [];
	var rowMeasures = [];
	var dimensionMetadata = [];  //This includes both measures and dimensions.
	var allDimensions = [];  //This includes both measures and dimensions.	
	
	var longestDimSet = 0;  	//This is the number of data columns
	var numberOfDataTuples = 0;	//This is the number of tuples
	var headerData = zenResultSetJSON.dimensions;
	for (var i = 0; i < headerData.length; i++) {
		var members = [];
		var perDimMembers = []
		if (typeof(headerData[i].containsMeasures) != "undefined"){
			//we have a measure
			for (var j = 0; j < headerData[i].members.length; j++) {
				if (displayType == 'text'){
					perDimMembers.push(headerData[i].members[j].text);
				} else{
					perDimMembers.push(headerData[i].members[j].key);
				}
			}

			if (headerData[i].axis == "COLUMNS"){
				colMeasures.push(perDimMembers);
				//keeping track of the longest set of dimensions
				if (perDimMembers.length > longestDimSet){
					longestDimSet = perDimMembers.length;
				}
			} else{
				rowMeasures.push(perDimMembers);
				
				//Add the measure to the rows header
				if (displayType == 'text'){
					headerTuple.push(headerData[i].text);
				} else{
					headerTuple.push(headerData[i].key);
				}
			}
			
		} else{
			// we have a dimension
			for (var j = 0; j < headerData[i].members.length; j++) {
				if (displayType == 'text'){
					perDimMembers.push(headerData[i].members[j].text);
				} else{
					perDimMembers.push(headerData[i].members[j].key);
				}
				//keeping track of the number of tuples
				if (headerData[i].members.length > numberOfDataTuples){
					numberOfDataTuples = headerData[i].members.length;
				}
			}
			
			if (headerData[i].axis == "COLUMNS"){
				colDimensions.push(perDimMembers);
				//keeping track of the longest set of dimensions
				if (perDimMembers.length > longestDimSet){
					longestDimSet = perDimMembers.length;
				}
			} else{
				rowDimensions.push(perDimMembers);
				
				//Add the dimension to the rows header
				if (displayType == 'text'){
					headerTuple.push(headerData[i].text);
				} else{
					headerTuple.push(headerData[i].key);
				}
			}			
		}
		allDimensions.push(perDimMembers);
	}
	
	//Before we build the data tuples, we'll have to collect the displayed dimensions
	//row_data informs us as to which members are displayed in each row/column combination
	//In the next step, we'll prepare the row label region, with its dimension members; as well as the repeatMask

	//Start with the header row
	var headerMaskTuple = [];
	for (var q = 0; q < zenResultSetJSON.axis_rows[0].length; q++) {
		if (zenResultSetJSON.axis_rows[0][q] > -1){
			headerMaskTuple.push("tableHeaderRow");
		}
	}
	//repeatMask.push(headerMaskTuple)
	
	var lastRepeatMaskTuple = [];
	for (var n = 0; n < zenResultSetJSON.axis_rows.length; n++) {
		var rowDimTuple = [];
		var currentRepeatMaskTuple = [];
		for (var p = 0; p < zenResultSetJSON.axis_rows[n].length; p++) {
			if (zenResultSetJSON.axis_rows[n][p] > -1){
				try{
					var currIndex = zenResultSetJSON.axis_rows[n][p]
					var currVal = allDimensions[p][currIndex];
					rowDimTuple.push(currVal);
					if (n > 0){
						if (repeatMask[n-1][p] == currVal){
							currentRepeatMaskTuple.push("tableRepeatFollower");
						}
						else {
							currentRepeatMaskTuple.push("tableRepeatLeader");
						}
					}
					else {
						currentRepeatMaskTuple.push("tableRepeatLeader");
					}
				}
				catch(err){
					catchMe = "Now";
				}
			}
		}
		rowDimensionTuples.push(rowDimTuple);
		lastRepeatMaskTuple = rowDimTuple;
		repeatMask.push(currentRepeatMaskTuple)
	}
						
	
	//Build the table data tuples.
	//  A single tuple will contain all of the row labels and the 
	var nNthDataPoint = -1;

	var lastRowTuple = [];
	for (var i = 0; i < rowDimensionTuples.length; i++) {
		var rowTuple = [];
		var nNth = 0;

		//Add the leading row labels
		for (var j = 0; j < rowDimensionTuples[0].length; j++) {
			try{
				if (typeof(rowDimensionTuples[i][j]) != "undefined"){
					rowTuple.push(rowDimensionTuples[i][j]);
				} else{
					rowTuple.push("");
				}
			}
			catch(err){
				catchMe = "Now";
			}
			nNth++;
		}
		for (var j = 0; j < rowMeasures.length; j++) {
			if (typeof(rowMeasures[j][i]) != "undefined"){
				rowTuple.push(rowMeasures[j][i]);
				if (i > 0){
				}
			} else{
				rowTuple.push("");
			}
			nNth++;
		}
		
		//Now add the actual row data to the tuple
		for (var j = 0; j < longestDimSet; j++){
			nNthDataPoint++;
			if (typeof(zenResultSetJSON.data[nNthDataPoint]) != "undefined"){
				rowTuple.push(zenResultSetJSON.data[nNthDataPoint]);
			}
			else{
				rowTuple.push("");
			}
			repeatMask[i].push("tableData");
		}
		
		rowTuples.push(rowTuple);
		lastRowTuple = rowTuple;
	}
	// The data tuples are now complete
	
	
	
	// Build the Table Headers
	
	
	// The initial entries (directly above the row dim/measure members on the left side of the table) are blank
	// The dimension/measure headers directly above the rows region was already filled out.
	
	//"Normalize" the lengths of the column dim/measure members.
	for (var i = 0; i < colMeasures.length; i++) {
		var localLength = colMeasures[i].length;
		var spans = Math.floor(longestDimSet/localLength);
		if (spans > 1){
			for (var j = 1; j < spans; j++) {
				for (var k = 0; k < localLength; k++){
					if (typeof(colMeasures[i][k]) != "undefined"){
						colMeasures[i].push(colMeasures[i][k])
					}
				}
			}
		}
	}
	
	for (var i = 0; i < colDimensions.length; i++) {
		var localLength = colDimensions[i].length;
		var spans = Math.floor(longestDimSet/localLength);
		if (spans > 1){
			for (var j = 1; j < spans; j++) {
				for (var k = 0; k < localLength; k++){
					if (typeof(colDimensions[i][k]) != "undefined"){
						colDimensions[i].push(colDimensions[i][k])
					}
				}
			}
		}
	}
	
	//The lengths of the table headers whould now be normalized
	//compress all of the "stacked" header rows into a single row.
	for (var i = 0; i < longestDimSet; i++) {
		var currentHeader = "";
		for (var j = 0; j < colMeasures.length; j++) {
			if (typeof(colMeasures[j][i]) != "undefined"){
				if (currentHeader.length > 0){
					currentHeader = currentHeader + "";
				}
				currentHeader = currentHeader + " " + colMeasures[j][i];
			} 
		}
		for (var j = 0; j < colDimensions.length; j++) {
			if (typeof(colDimensions[j][i]) != "undefined"){
				if (currentHeader.length > 0){
					currentHeader = currentHeader + "";
				}
				currentHeader = currentHeader + " " + colDimensions[j][i];
			} 
		}
		headerTuple.push(currentHeader);
	}				
}
